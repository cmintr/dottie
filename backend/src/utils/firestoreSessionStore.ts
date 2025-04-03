import { Store } from 'express-session';
import { firestore } from 'firebase-admin';
import { logger } from './logger';

/**
 * Custom session store implementation using Firestore
 * This allows sessions to be stored in a distributed database rather than in memory,
 * which is essential for multi-instance environments like Cloud Run
 */
export class FirestoreSessionStore extends Store {
  private db: firestore.Firestore;
  private collection: string;
  private ttl: number;

  /**
   * Create a new FirestoreSessionStore
   * @param options Configuration options
   */
  constructor(options: {
    db?: firestore.Firestore;
    collection?: string;
    ttl?: number;
  } = {}) {
    super();
    
    // Get Firestore instance from options or use the default
    this.db = options.db || firestore();
    
    // Collection name for storing sessions
    this.collection = options.collection || 'sessions';
    
    // Time-to-live in seconds (default: 1 day)
    this.ttl = options.ttl || 86400;
    
    logger.info(`Initialized FirestoreSessionStore with collection: ${this.collection}`);
  }

  /**
   * Get a session by ID
   * @param sid Session ID
   * @param callback Callback function
   */
  get(sid: string, callback: (err: any, session?: any) => void): void {
    this.db.collection(this.collection)
      .doc(sid)
      .get()
      .then(doc => {
        if (!doc.exists) {
          return callback(null);
        }
        
        const data = doc.data();
        if (!data) {
          return callback(null);
        }
        
        // Check if session has expired
        if (data.expires && data.expires.toMillis() < Date.now()) {
          this.destroy(sid, () => {});
          return callback(null);
        }
        
        try {
          const session = data.session ? JSON.parse(data.session) : {};
          return callback(null, session);
        } catch (err) {
          return callback(err);
        }
      })
      .catch(err => {
        logger.error(`Error getting session ${sid}:`, err);
        callback(err);
      });
  }

  /**
   * Set a session
   * @param sid Session ID
   * @param session Session data
   * @param callback Callback function
   */
  set(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      const expires = new Date(Date.now() + (this.ttl * 1000));
      const sessionStr = JSON.stringify(session);
      
      this.db.collection(this.collection)
        .doc(sid)
        .set({
          session: sessionStr,
          expires: firestore.Timestamp.fromDate(expires),
          updatedAt: firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          if (callback) callback();
        })
        .catch(err => {
          logger.error(`Error setting session ${sid}:`, err);
          if (callback) callback(err);
        });
    } catch (err) {
      logger.error(`Error serializing session ${sid}:`, err);
      if (callback) callback(err);
    }
  }

  /**
   * Destroy a session
   * @param sid Session ID
   * @param callback Callback function
   */
  destroy(sid: string, callback?: (err?: any) => void): void {
    this.db.collection(this.collection)
      .doc(sid)
      .delete()
      .then(() => {
        if (callback) callback();
      })
      .catch(err => {
        logger.error(`Error destroying session ${sid}:`, err);
        if (callback) callback(err);
      });
  }

  /**
   * Touch a session (update expiration)
   * @param sid Session ID
   * @param session Session data
   * @param callback Callback function
   */
  touch(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      const expires = new Date(Date.now() + (this.ttl * 1000));
      
      this.db.collection(this.collection)
        .doc(sid)
        .update({
          expires: firestore.Timestamp.fromDate(expires),
          updatedAt: firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          if (callback) callback();
        })
        .catch(err => {
          logger.error(`Error touching session ${sid}:`, err);
          if (callback) callback(err);
        });
    } catch (err) {
      logger.error(`Error touching session ${sid}:`, err);
      if (callback) callback(err);
    }
  }

  /**
   * Clear all sessions
   * @param callback Callback function
   */
  clear(callback?: (err?: any) => void): void {
    // Note: Firestore doesn't have a direct "delete collection" method
    // We need to get all documents and delete them in batches
    this.db.collection(this.collection)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          if (callback) callback();
          return;
        }
        
        // Use batched writes for better performance
        const batchSize = 500; // Firestore batch limit is 500
        const batches: firestore.WriteBatch[] = [];
        let currentBatch = this.db.batch();
        let operationCount = 0;
        
        snapshot.docs.forEach(doc => {
          currentBatch.delete(doc.ref);
          operationCount++;
          
          if (operationCount >= batchSize) {
            batches.push(currentBatch);
            currentBatch = this.db.batch();
            operationCount = 0;
          }
        });
        
        // Add the last batch if it has operations
        if (operationCount > 0) {
          batches.push(currentBatch);
        }
        
        // Commit all batches
        return Promise.all(batches.map(batch => batch.commit()));
      })
      .then(() => {
        if (callback) callback();
      })
      .catch(err => {
        logger.error('Error clearing sessions:', err);
        if (callback) callback(err);
      });
  }

  /**
   * Get the number of sessions
   * @param callback Callback function
   */
  length(callback: (err: any, length?: number) => void): void {
    this.db.collection(this.collection)
      .get()
      .then(snapshot => {
        callback(null, snapshot.size);
      })
      .catch(err => {
        logger.error('Error getting session count:', err);
        callback(err);
      });
  }

  /**
   * Get all sessions
   * @param callback Callback function
   */
  all(callback: (err: any, sessions?: { [sid: string]: any }) => void): void {
    this.db.collection(this.collection)
      .get()
      .then(snapshot => {
        const sessions: { [sid: string]: any } = {};
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data && data.session) {
            try {
              sessions[doc.id] = JSON.parse(data.session);
            } catch (err) {
              logger.error(`Error parsing session ${doc.id}:`, err);
            }
          }
        });
        
        callback(null, sessions);
      })
      .catch(err => {
        logger.error('Error getting all sessions:', err);
        callback(err);
      });
  }
}
