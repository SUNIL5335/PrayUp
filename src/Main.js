import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import WelcomeScreen from '../screens/Welcome';
import ChatScreen from '../screens/Chat';
import SplashScreen from '../screens/Splash';
import LandingPageScreen from '../screens/LandingPage';
import WallFeedPostScreen from '../screens/WallFeedsPost';
import QuestionsScreen from '../screens/Questions';

const Stack = createStackNavigator();

export default function Main() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem('UserSession').then((value) => {
      if (value == null) {
        setTimeout(() => {
          setShowSplash(false);
        }, 1000);
      } else {
        setShowSplash(false);
      }
    });
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  } else {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Landing" component={LandingPageScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="WallPost" component={WallFeedPostScreen} />
          <Stack.Screen name="Questions" component={QuestionsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
