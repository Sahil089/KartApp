from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from google.cloud import storage
from pymongo.mongo_client import MongoClient
import bcrypt
import concurrent.futures
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from config import mongopass
import tempfile

app = Flask(__name__)
CORS(app)

# Use environment variables for Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv('GOOGLE_CLOUD_CREDENTIALS', 'path_to_default_cred.json')

# Initialize Google Cloud storage and MongoDB client
client = storage.Client()
bucket_name = 'image-website-bucket'
csv_filename = 'products.csv'
bucket = client.bucket(bucket_name)
blob = bucket.blob(csv_filename)

# Initialize MongoDB connection using secure credentials
clientmongo = MongoClient(mongopass)
db = clientmongo.crud
myCollection = db.myColl
myCollectionAdmin = db.myAdmin

UPLOAD_FOLDER = 'uploads'


def read_csv_from_gcs():
    # Handle potential race conditions with tempfile
    with tempfile.NamedTemporaryFile(suffix='.csv') as temp_file:
        blob.download_to_filename(temp_file.name)
        return pd.read_csv(temp_file.name)


def write_csv_to_gcs(df):
    # Handle potential race conditions with tempfile
    with tempfile.NamedTemporaryFile(suffix='.csv', mode='w', delete=False) as temp_file:
        df.to_csv(temp_file.name, index=False)
        blob.upload_from_filename(temp_file.name)


def admin_product_description(img_url):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_object = executor.submit(objects_detection, img_url)
        future_labels = executor.submit(label_detection, img_url)
        future_logo = executor.submit(logo_detection, img_url)
        
        obj_result = future_object.result()
        lab_result = future_labels.result()
        logo_result = future_logo.result()

    final_data = logo_result + lab_result + obj_result
    return final_data


def product_description(img):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_object = executor.submit(objects_detection, img)
        future_labels = executor.submit(label_detection, img)
        future_logo = executor.submit(logo_detection, img)
        
        obj_result = future_object.result()
        lab_result = future_labels.result()
        logo_result = future_logo.result()

    final_data = logo_result + lab_result + obj_result
    if final_data == "Invalid Url":
        return final_data
    else:
        string_data = ' '.join(final_data).lower().split()
        most_relevant_label = find_relevant_labels_with_urls(string_data, df)
        final_pr_detail = df[df['image_url'].isin(most_relevant_label)]
        pr_data = most_relevant_label
        pr_name = final_pr_detail['product_name']
        return pr_data, pr_name.tolist()


def password_hasing(my_pass):
    salt = bcrypt.gensalt()
    b = bytes(my_pass, 'utf-8')
    hash_password = bcrypt.hashpw(password=b, salt=salt)
    return hash_password


def password_unhasing(my_bpass, user_pass):
    p = bytes(user_pass, 'utf-8')
    check = bcrypt.checkpw(password=p, hashed_password=my_bpass)
    return check


def find_relevant_labels_with_urls(image_labels, df, threshold=0.4):
    image_label_str = ' '.join(image_labels)
    product_labels_list = df['product_lables'].fillna('').tolist()
    all_labels = product_labels_list + [image_label_str]
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_labels)
    
    cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
    labeled_similarities = [(product_labels_list[i], cosine_similarities[i], df.iloc[i]['image_url']) for i in range(len(product_labels_list))]
    relevant_labeled_similarities = [item for item in labeled_similarities if item[1] >= threshold]
    relevant_labeled_similarities.sort(key=lambda x: x[1], reverse=True)

    ranked_relevant_image_urls = [url for _, _, url in relevant_labeled_similarities]
    return ranked_relevant_image_urls


@app.route('/user-login', methods=['POST'])
def user_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    read = myCollection.find()
    for record in read:
        presentEmail = record["email"]
        presentPass = record["pass"]
        presentPass = password_unhasing(presentPass, password)
        if presentEmail == email and presentPass:
            return jsonify({"message": "Welcome to The User Page"}), 200

    return jsonify({"message": "User Not Found Please Register"}), 404


@app.route('/login-register', methods=['POST'])
def login_user():
    data = request.json
    email = data.get('emailUser')
    password = data.get('passwordUser')
    name = data.get('nameUser')
    role = data.get('roleUser')

    if not email or not password or not name or not role:
        return jsonify({"message": "Missing required fields"}), 400

    if role == 'Admin':
        if myCollectionAdmin.find_one({"email": email}):
            return jsonify({"message": "Email Already Exists"}), 400
        hashpass = password_hasing(password)
        data = {"name": name, "email": email, "pass": hashpass}
        myCollectionAdmin.insert_one(data)
    else:
        if myCollection.find_one({"email": email}):
            return jsonify({"message": "Email Already Exists"}), 400
        hashpass = password_hasing(password)
        data = {"name": name, "email": email, "pass": hashpass}
        myCollection.insert_one(data)

    return jsonify({"message": "Registration Successful"}), 200


@app.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    read = myCollectionAdmin.find()
    for record in read:
        presentEmail = record["email"]
        presentPass = record["pass"]
        presentPass = password_unhasing(presentPass, password)
        if presentEmail == email and presentPass:
            return jsonify({"message": "Welcome to The Admin Page"}), 200

    return jsonify({"message": "Admin Not Found Please Register"}), 404


@app.route('/add-product', methods=['POST'])
def add_product():
    data = request.json
    product_name = data.get('prdname')
    image_url = data.get('imgurl')

    if not product_name or not image_url:
        return jsonify({"message": "Invalid data"}), 404

    try:
        existing_df = read_csv_from_gcs()
        if existing_df['image_url'].str.contains(image_url).any():
            return jsonify({"message": "Product already exists"}), 404

        final_labels = admin_product_description(image_url)
        product_labels = ' '.join(final_labels)

        new_data = pd.DataFrame([[product_name.upper(), image_url, product_labels]], columns=['product_name', 'image_url', 'product_lables'])
        updated_df = pd.concat([existing_df, new_data], ignore_index=True)

        write_csv_to_gcs(updated_df)

        return jsonify({"message": "Product added successfully"}), 200
    except Exception as e:
        return jsonify({"status": f"Error: {e}"}), 404


if __name__ == '__main__':
    app.run(debug=True)
