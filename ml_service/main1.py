if __name__ == "__main__":
    import firebase_admin
    from firebase_admin import credentials, firestore
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    db.collection("test").document("testdoc").set({"hello": "world"})
    print("Wrote test doc to Firestore!")
