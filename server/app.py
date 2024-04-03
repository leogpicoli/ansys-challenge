from flask import Flask, request, jsonify

from flask_cors import CORS  # Import the CORS extension

app = Flask(__name__)
CORS(app)  # Apply CORS to your app

# Create an empty list to store JSON objects
data_store = []

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/car-path', methods=['POST'])
def post_json():
    try:
        # Get the JSON data from the request
        json_data = request.get_json()

        # Append the JSON data to the data store
        data_store.append(json_data)

        print("Saved new car-path", json_data)

        return jsonify({"message": "JSON object received and saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run()
