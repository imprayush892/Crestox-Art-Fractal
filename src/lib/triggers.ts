
import 'server-only';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// This prevents the app from being initialized multiple times
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export const onManualReviewRequest = onDocumentUpdated("fractals/{fractalId}", async (event) => {
  if (!ADMIN_EMAIL) {
    console.error("NEXT_PUBLIC_ADMIN_EMAIL is not set. Cannot send notification.");
    return;
  }

  const snapshot = event.data;
  if (!snapshot) return;

  const fractalBefore = snapshot.before.data();
  const fractalAfter = snapshot.after.data();

  // Trigger only when status changes to 'pending_review'
  if (fractalBefore.status !== 'pending_review' && fractalAfter.status === 'pending_review') {
    console.log(`Artwork ${event.params.fractalId} submitted for manual review. Notifying admin.`);
    
    try {
      // Find the admin user by email
      const usersRef = db.collection('users');
      const adminQuery = await usersRef.where('email', '==', ADMIN_EMAIL).limit(1).get();

      if (adminQuery.empty) {
        console.warn(`Admin user with email ${ADMIN_EMAIL} not found. Cannot send notification.`);
        return;
      }
      const adminId = adminQuery.docs[0].id;

      // Find the artist to include their name in the notification
      const artistRef = db.collection('artists').doc(fractalAfter.artistId);
      const artistSnap = await artistRef.get();
      const artistName = artistSnap.exists() ? artistSnap.data()?.name : 'An artist';

      // Create the notification document
      const notification = {
        message: `${artistName} requested a manual review for an artwork.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'manual_valuation_request',
        relatedContent: {
          title: `Artwork: ${fractalAfter.title}`,
          url: `/portfolio/artwork/edit/${event.params.fractalId}`,
        }
      };

      await db.collection('users').doc(adminId).collection('notifications').add(notification);
      console.log(`Notification sent to admin ${adminId} for artwork ${event.params.fractalId}.`);

    } catch (error) {
      console.error("Error sending admin notification:", error);
    }
  }
});
