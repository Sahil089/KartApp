from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from function.mai import logo_detection,objects_detection,label_detection
from google.cloud import storage
from pymongo.mongo_client import MongoClient
import bcrypt
import concurrent.futures
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


app=Flask(__name__)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credintial/cread_new.json"
client = storage.Client.from_service_account_json('credintial/cread_new.json')
bucket_name = 'image-website-bucket'
csv_filename = 'products.csv'
bucket = client.bucket(bucket_name)
blob = bucket.blob(csv_filename)


mongopass="mongodb+srv://20010532:Sahil%40123@cluster1.lggqel9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"
clientmongo=MongoClient(mongopass)
db=clientmongo.crud
myCollection=db.myColl
myCollectionAdmin=db.myAdmin



UPLOAD_FOLDER='uploads'
CORS(app)
def read_csv_from_gcs():
    temp_path = f'{csv_filename}'
    blob.download_to_filename(temp_path)
    return pd.read_csv(temp_path)

df=read_csv_from_gcs()
# print(df)
def write_csv_to_gcs(df):
    temp_path = f'{csv_filename}'
    df.to_csv(temp_path, index=False)
    blob.upload_from_filename(temp_path)
 
def admin_product_description(img_url):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_object = executor.submit(objects_detection, img_url)
        future_labels = executor.submit(label_detection, img_url)
        future_logo = executor.submit(logo_detection, img_url)
        obj_result = future_object.result()
        lab_result = future_labels.result()
        logo_result = future_logo.result()
    
    final_data = logo_result + lab_result+obj_result
    return final_data


def product_description(img):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_object = executor.submit(objects_detection, img)
        future_labels = executor.submit(label_detection, img)
        future_logo = executor.submit(logo_detection, img)
        obj_result = future_object.result()
        lab_result = future_labels.result()
        logo_result = future_logo.result()
    
    final_data = logo_result + lab_result+obj_result
    # print(final_data)
    if final_data=="Invalid Url":
        return final_data
    else:
        string_data=' '.join(final_data)
        string_data=string_data.lower().split()
        # print(string_data)
        # print(csv_lables)
        most_relevant_label= find_relevant_labels_with_urls(string_data,df)
        # print(most_relevant_label)
        final_pr_detail= df[df['image_url'].isin(most_relevant_label)]
        # print(final_pr_detail)
        pr_data= most_relevant_label
        pr_name=final_pr_detail['product_name']
        # print(pr_name)
        return pr_data,pr_name
def password_hasing(my_pass):
    salt = bcrypt.gensalt()
    b = bytes(my_pass, 'utf-8')
    hash_password = bcrypt.hashpw(
    password=b,
    salt=salt
    )
    return hash_password

def password_unhasing(my_bpass,user_pass):
    p = bytes(user_pass, 'utf-8')
    check = bcrypt.checkpw(
    password=p,
    hashed_password=my_bpass)
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

# ----------------------------------------loginpage-----------------------------------------------------------    
@app.route('/user-login', methods=['POST'])
def user_login():
    data = request.json
    email= data.get('email')
    password=data.get('password')
    # print(email)
    # print(password)
    read=myCollection.find()
    for record in read:
        presentEmail=record["email"]
        presentPass=record["pass"]
        presentPass=password_unhasing(presentPass,password)
        if presentEmail == email and presentPass:
            return jsonify({"message":"Welcome to The User Page"}),200
    return jsonify({"message":"User Not Found Please Register"}),404  


@app.route('/login-register', methods=['POST'])
def login_user():
    email=request.json.get('emailUser')
    password=request.json.get('passwordUser')
    name=request.json.get('nameUser')
    role=request.json.get('roleUser')
    if role=='Admin':
        read=myCollectionAdmin.find()
        for record in read:
            presentEmail=record["email"]
            if presentEmail == email:
             return jsonify({"message":"Email Already Exists"}),500
        hashpass=password_hasing(password)
        data={"name":name,"email":email,"pass":hashpass}
        x=myCollectionAdmin.insert_one(data)
    else:
        read=myCollection.find()
        for record in read:
            presentEmail=record["email"]
            if presentEmail == email:
             return jsonify({"message":"Email Already Exists"})
        hashpass=password_hasing(password)
        data={"name":name,"email":email,"pass":hashpass}
        x=myCollection.insert_one(data)
    return jsonify({"message":"Registration Succesfull"}),200

@app.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.json
    email= data.get('email')
    password=data.get('password')
    # print(email)
    # print(password)
    read=myCollectionAdmin.find()
    for record in read:
        presentEmail=record["email"]
        presentPass=record["pass"]
        presentPass=password_unhasing(presentPass,password)
        if presentEmail == email and presentPass:
            return jsonify({"message":"Welcome to The Admin Page"}),200
    return jsonify({"message":"Admin Not Found Please Register"}),404  
# -------------------------------------adminfeatureenpoints-------------------------------------------------

@app.route('/add-product', methods=['POST'])
def add_product():
    data = request.json
    product_name = data.get('prdname')
    product_name = product_name.upper()
    image_url=data.get('imgurl')

    if not product_name or not image_url:
        return jsonify({"message": "Invalid data"}), 404

    try:
        existing_df = read_csv_from_gcs()
        # print(existing_df)
        if existing_df['image_url'].str.contains(image_url).any():
            return jsonify({"message": "Product already exists"}), 404
        final_lables=admin_product_description(image_url)
        product_lables= ' '.join(final_lables)

        new_data = pd.DataFrame([[product_name,image_url,product_lables]], columns=['product_name', 'image_url','product_lables'])
        updated_df = pd.concat([existing_df, new_data], ignore_index=True)
        # print(updated_df)
        write_csv_to_gcs(updated_df)

        return jsonify({"message": "Product added successfully"}), 200

    except Exception as e:
        return jsonify({"status": f"Error: {e}"}), 404


@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    file = request.files['csvFile']
    # print(file)
    if not file or not file.filename.endswith('.csv'):
        return jsonify({"message": "Invalid file format"}), 400

    try:
        uploaded_df = pd.read_csv(file)
        
        if not {'product_name','image_url'}.issubset(uploaded_df.columns):
            return jsonify({"message": "Invalid CSV format please check your CSV again"}), 400
        
        
        uploaded_df['product_name'] = uploaded_df['product_name'].str.upper()
        existing_df = read_csv_from_gcs()
        # print(existing_df)


        duplicate_urls = uploaded_df[uploaded_df['image_url'].isin(existing_df['image_url'])]
        duplicate_count = duplicate_urls.shape[0]


        new_data = uploaded_df[~uploaded_df['image_url'].isin(existing_df['image_url'])]
        new_data['product_lables'] = new_data['image_url'].apply(lambda url:' '.join(admin_product_description(url)))
        # print(new_data)
        merged_df = pd.concat([existing_df, new_data], ignore_index=True)
        # print(merged_df)
        write_csv_to_gcs(merged_df)

        return jsonify({
        "message": "CSV uploaded and merged successfully",
        "duplicate_count": f"Duplicate data = {duplicate_count}",
         "new_records_added": f"New records added = {new_data.shape[0]}"
        }), 200

    except Exception as e:
        return jsonify({"message": "Invalid csv format please check your CSV again"}), 500

# ------------------------------------------userendpoint-------------------------------------------------------------

@app.route('/submit', methods = ['POST'])   
def submit():   
    f = request.files['file']
    if f.filename == '':
        return jsonify({"message":"No file Selected"})   
    file_path = os.path.join(UPLOAD_FOLDER, f.filename)
    f.save(file_path)  
    data,name=product_description(file_path)
    data=data
    name=name.tolist()
    # print(name)
    if not data:
        return jsonify({"message":"Sorry no Product Found"}) ,404
    else:

        final_result={
            "image_urls": data
        }
    
        return jsonify(final_result),200


@app.route('/submit-name',methods=['POST'])
def submit_file():
    name=request.json.get('prName')
    name=name.upper()
    # print(name)
    avail_pr=read_csv_from_gcs()
    # print(avail_pr)
    avail_pr['product_lables'] = avail_pr['product_lables'].str.upper()
    urls=avail_pr[avail_pr["product_lables"].str.contains(name)]['image_url'].tolist()
    # print(final_data)
    # urls=final_data["image_url"].to_list()
    if urls:
        return jsonify({"prnameurls": urls}),200
    else:
        return jsonify({"message":"Sorry No Product Found"}),404

    




if __name__ == '__main__':
    app.run(debug=True)
  










    