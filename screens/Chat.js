import React, { useEffect, useState, useCallback } from 'react';
import { Platform, SafeAreaView, KeyboardAvoidingView, View, Text } from 'react-native';
import { Actions, Bubble, GiftedChat, Send, Avatar as ChatAvatar, MessageText, Icon } from 'react-native-gifted-chat';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Avatar } from 'react-native-paper';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, onSnapshot, setDoc, updateDoc, doc, query } from 'firebase/firestore';
import Header from './Header';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

const auth = getAuth();
const db = getFirestore();

const randomId = uuidv4();

const ChatScreen = ({ route, navigation }) => {
  const userRef = query(collection(db, 'userdata'));
  const [users] = useCollectionData(userRef);
  const [currentUser] = useAuthState(auth);
  const [currentUserType, setCurrentUseType] = useState("");
  const [messages, setMessages] = useState([]);

  const room = route.params ? route.params.room : 0;

  const roomId = room ? room.id : randomId;
  const roomRef = doc(db, 'rooms', roomId);
  const roomMessagesRef = collection(db, 'rooms', roomId, 'messages');

  const getRandomVolunteer = () => {
    const allVolunteer = users
      .filter((u) => u.type === 'Volunteer')
      .map((u) => ({ displayName: u.displayName, email: u.email.toLowerCase(), type: u.type }));
    return allVolunteer[Math.floor(Math.random() * allVolunteer.length)];
  };

  const getAllAdminsAndLeaders = () => {
    return users.filter((u) => u.type === 'admin' || u.type === 'Chapter Leader').map((u) => ({ displayName: u.displayName, email: u.email.toLowerCase(), type: u.type }))
  };

  useEffect(() => {
    AsyncStorage.getItem('UserSession').then((value) => {
      if (value !== null) {
        const usr = JSON.parse(value);
        setCurrentUseType(usr.type)
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!room && users) {
        const currUserData = {
          displayName: currentUser.displayName,
          email: currentUser.email.toLowerCase(),
          type: currentUserType
        };
        const userBData = getRandomVolunteer();
        const roomData = {
          participants: [...getAllAdminsAndLeaders(), userBData, currUserData],
          participantsArray: [currUserData.email, userBData.email, ...getAllAdminsAndLeaders().map(u => u.email)],
        };
        try {
          await setDoc(roomRef, roomData);
        } catch (error) {
          console.log(error);
        }
      }
    })();
  }, [users]);

  useEffect(() => {
    const unsubscribe = onSnapshot(roomMessagesRef, (querySnapshot) => {
      const messagesFirestore = querySnapshot
        .docChanges()
        .filter(({ type }) => type === 'added')
        .map(({ doc }) => {
          const message = doc.data();
          return { ...message, createdAt: message.createdAt.toDate() };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      appendMessages(messagesFirestore);
    });
    return () => unsubscribe();
  }, []);

  const appendMessages = useCallback(
    (messages) => {
      setMessages((previousMessages) => GiftedChat.append(previousMessages, messages));
    },
    [messages],
  );

  console.log(messages);

  const parse = (messages) => {
    if (messages === undefined) {
      return [];
    }

    let msg = [];
    messages.forEach((val) => {
      const { _id, user, text, createdAt, image } = val;
      let t = new Date(1970, 0, 1);
      t.setSeconds(createdAt.seconds);
      msg.push({
        _id,
        createdAt: t,
        text,
        user,
        image,
      });
    });

    return msg;
  };

  const getUser = () => {
    const { uid, photoURL } = auth.currentUser;
    return {
      _id: uid,
      name: currentUser.displayName,
      avatar: photoURL,
    };
  };

  const sendMessage = async (messages = []) => {
    const writes = messages.map((m) => addDoc(roomMessagesRef, m));
    const lastMessage = messages[messages.length - 1];
    writes.push(updateDoc(roomRef, { lastMessage }));
    await Promise.all(writes);
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View>
          <MaterialCommunityIcons
            name="send-circle"
            style={{ marginBottom: 5, marginRight: 5 }}
            size={32}
            color="#2e64e5"
          />
        </View>
      </Send>
    );
  };

  const renderAvatar = (props) => {
    return (
      <ChatAvatar {...props}>
        <View>
          <Avatar.Text size={24} label="XD" />
        </View>
      </ChatAvatar>
    );
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#2e64e5',
          },
          left: {
            backgroundColor: '#E8E8E8',
          },
        }}
        textStyle={{
          left: {
            fontFamily: 'Nunito',
          },
          right: {
            color: '#fff',
            fontFamily: 'Nunito',
          },
        }}
      />
    );
  };

  const scrollToBottomComponent = () => {
    return <FontAwesome name="angle-double-down" size={22} color="#333" />;
  };

  const chat = (
    <GiftedChat
      messages={messages}
      onSend={sendMessage}
      user={getUser()}
      renderBubble={renderBubble}
      alwaysShowSend
      renderSend={renderSend}
      renderMessageText={(props) => {
        console.log(props);
        return (
          <View>
            <Text
              style={{
                marginLeft: 10,
                marginTop: 10,
                paddingRight: 20,
                fontWeight: 'bold',
                color: props.position === 'right' ? '#292929' : 'grey',
              }}
            >
              {props.currentMessage.user.name}
            </Text>
            <MessageText {...props} />
          </View>
        );
      }}
      scrollToBottom
      scrollToBottomComponent={scrollToBottomComponent}
      renderAvatar={renderAvatar}
      renderActions={(props) => (
        <Actions
          {...props}
          containerStyle={{
            position: 'absolute',
            right: 50,
            bottom: 5,
            zIndex: 9999,
          }}
          onPressActionButton={() => {}}
          icon={() => <Ionicons name="attach-outline" size={30} color={'#717171'} />}
        />
      )}
    />
  );

  if (Platform.OS === 'android') {
    return (
      <View>
        <Header navigation={navigation} goBack={true} />
        <KeyboardAvoidingView style={{ flex: 1 }} behaviour="padding" keyboardVerticalOffset={30} enabled>
          {chat}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header navigation={navigation} showBack={true} headingTitle={'Chat'} />
      {chat}
    </SafeAreaView>
  );
};

export default ChatScreen;
