import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';


const App = () => {
  // State for messages, current message, and user
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase when component mounts
  useEffect(() => {
    // Your Firebase configuration
    // Replace with your own Firebase project config
    const firebaseConfig = {
      apiKey: "AIzaSyCl6YvvZqnu9Fracr9gb9oRJnHcSavVfLk",
      authDomain: "messanger-7e1dd.firebaseapp.com",
      projectId: "messanger-7e1dd",
      storageBucket: "messanger-7e1dd.firebasestorage.app",
      messagingSenderId: "668040134884",
      appId: "1:668040134884:web:8ebacb3e9035cac79eacf1",
      measurementId: "G-TBM63Z35QK"
    };
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Anonymous authentication
    signInAnonymously(auth)
      .catch((error) => {
        console.error("Error signing in anonymously:", error);
      });

    // Auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
      }
    });

    // Subscribe to messages collection
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const messageData = [];
      snapshot.forEach((doc) => {
        messageData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMessages(messageData);
      setLoading(false);
    });

    // Clean up listeners on unmount
    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // Function to send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: user.uid,
        displayName: `User-${user.uid.substr(0, 4)}`,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1>Firebase Chat</h1>
        <p>Logged in as: {user ? `User-${user.uid.substr(0, 4)}` : 'Guest'}</p>
      </header>
      
      <div className="messages-container" id="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.userId === user?.uid ? 'sent' : 'received'}`}
          >
            <span className="message-user">{message.displayName}</span>
            <p className="message-text">{message.text}</p>
            <span className="message-time">
              {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : 'Sending...'}
            </span>
          </div>
        ))}
      </div>
      
      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
};

export default App;