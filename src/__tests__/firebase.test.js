import * as firebase from "@firebase/testing";

const PROJECT_ID = "react-auth-96203";
const myId = "user1";
const theirId = "user2";
const myAuth = { uid: myId, email: "alice@example.com" };

function getFirestore(auth = null) {
    return firebase.initializeTestApp({
            projectId: PROJECT_ID,
            auth: auth,
        })
        .firestore();
}

function getAdminFirestore(auth = null) {
    return firebase.initializeAdminApp({
            projectId: PROJECT_ID,
        })
        .firestore();
}


beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
});

test("Can read items in the read-only collection", async () => {
    const db = getFirestore();
    const testDocument = db.collection("readonly").doc("testDocument");
    await firebase.assertSucceeds(testDocument.get());
});

test("Can't write items in the read-only collection", async () => {
    const db = getFirestore();
    const testDocument = db.collection("readonly").doc("testDocument");
    await firebase.assertFails(testDocument.set({title: "Hello"}));
});

test("Can write to a user document with same id as authenticated user", async () => {
    const db = getFirestore(myAuth);
    const testDocument = db.collection("users").doc(myId);
    await firebase.assertSucceeds(testDocument.set({title: "Hello from Alice"}));
});

test("Can't write to a user document with different id as authenticated user", async () => {
    const db = getFirestore(myAuth);
    const testDocument = db.collection("users").doc(theirId);
    await firebase.assertFails(testDocument.set({title: "Hello from Alice"}));
});

test("Can read public post", async () => {
    const db = getFirestore();
    const testQuery = db.collection("posts").where("visibility", "==", "public");
    await firebase.assertSucceeds(testQuery.get());
});

test("Can't query other user's posts", async () => {
    const db = getFirestore(myAuth);
    const testQuery = db.collection("posts").where("authorId", "==", theirId);
    await firebase.assertFails(testQuery.get());
});

/* When querying multiple documents security rules are checked before fetching
 * data for performance reason. Thats why we can't do any comparison against
 * the data
 */
test("Can't query all posts", async () => {
    const db = getFirestore(myAuth);
    const testQuery = db.collection("posts");
    await firebase.assertFails(testQuery.get());
});

test("Can read a single public post", async () => {
    const admin = getAdminFirestore();
    const postId = "public_post";
    const setupDoc = admin.collection("posts").doc(postId);
    await setupDoc.set({authorId: theirId, visibility: "public"});

    const db = getFirestore();
    const testRead = db.collection("posts").doc(postId);
    await firebase.assertSucceeds(testRead.get());
});

test("Can't read a private another user's private post", async () => {
    const admin = getAdminFirestore();
    const postId = "public_post";
    const setupDoc = admin.collection("posts").doc(postId);
    await setupDoc.set({authorId: theirId, visibility: "private"});

    const db = getFirestore();
    const testRead = db.collection("posts").doc(postId);
    await firebase.assertFails(testRead.get());
});

afterAll(async() => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
});






