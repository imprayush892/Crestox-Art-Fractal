import admin from 'firebase-admin';

// This script will be initialized using the GOOGLE_APPLICATION_CREDENTIALS environment variable
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.error('Please ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly in your .env file and points to a valid service account key.');
  process.exit(1);
}


const db = admin.firestore();
const auth = admin.auth();

async function listAllAuthUsers(nextPageToken) {
  const uids = new Set();
  const listUsersResult = await auth.listUsers(1000, nextPageToken);
  listUsersResult.users.forEach(userRecord => {
    uids.add(userRecord.uid);
  });
  if (listUsersResult.pageToken) {
    const moreUids = await listAllAuthUsers(listUsersResult.pageToken);
    moreUids.forEach(uid => uids.add(uid));
  }
  return uids;
}

async function findOrphanedUsers() {
  console.log('Fetching all authenticated users...');
  const authUids = await listAllAuthUsers();
  console.log(`Found ${authUids.size} authenticated users.`);

  console.log('Fetching all user documents from Firestore...');
  const firestoreUsersSnapshot = await db.collection('users').get();
  const firestoreUids = new Set(firestoreUsersSnapshot.docs.map(doc => doc.id));
  console.log(`Found ${firestoreUids.size} user documents in Firestore.`);
  
  const orphanedUids = [];
  firestoreUids.forEach(uid => {
    if (!authUids.has(uid)) {
      orphanedUids.push(uid);
    }
  });

  console.log(`Found ${orphanedUids.length} orphaned user documents.`);
  return orphanedUids;
}

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve, reject);
    });
}

async function deleteQueryBatch(query, resolve, reject) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve, reject);
    });
}


async function cleanup() {
  const orphanedUids = await findOrphanedUsers();

  if (orphanedUids.length === 0) {
    console.log('No orphaned users to clean up. Exiting.');
    return;
  }

  for (const uid of orphanedUids) {
    console.log(`--- Cleaning up data for orphaned user: ${uid} ---`);

    try {
      const batch = db.batch();

      // 1. Delete user document
      const userDocRef = db.collection('users').doc(uid);
      batch.delete(userDocRef);
      console.log(`Scheduled deletion for /users/${uid}`);

      // 2. Delete artist profile
      const artistQuery = db.collection('artists').where('userId', '==', uid).limit(1);
      const artistSnapshot = await artistQuery.get();
      if (!artistSnapshot.empty) {
        const artistDocRef = artistSnapshot.docs[0].ref;
        batch.delete(artistDocRef);
        console.log(`Scheduled deletion for artist profile at ${artistDocRef.path}`);
      }

      // 3. Delete resale listings
      const listingsQuery = db.collection('resaleListings').where('resellerId', '==', uid);
      const listingsSnapshot = await listingsQuery.get();
      if (!listingsSnapshot.empty) {
        listingsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          console.log(`Scheduled deletion for resale listing at ${doc.ref.path}`);
        });
      }

      await batch.commit();
      console.log(`Batch committed for user, artist, and listings for UID: ${uid}.`);

      // 4. Delete holdings subcollection (must be done after batch commit)
      console.log(`Deleting holdings subcollection for UID: ${uid}...`);
      await deleteCollection(`users/${uid}/holdings`, 50);
      console.log(`Finished deleting holdings for UID: ${uid}.`);


    } catch (error) {
      console.error(`Failed to clean up data for UID ${uid}:`, error);
    }
     console.log(`--- Finished cleanup for UID: ${uid} ---\n`);
  }

  console.log('Cleanup script finished.');
}

cleanup().catch(error => {
  console.error('An unexpected error occurred during the cleanup process:', error);
});
