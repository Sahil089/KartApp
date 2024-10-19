os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credintial/cread_new.json"
client = storage.Client.from_service_account_json('credintial/cread_new.json')
bucket_name = 'image-website-bucket'
csv_filename = 'products.csv'
bucket = client.bucket(bucket_name)
blob = bucket.blob(csv_filename)
