import React, {createRef, useEffect, useState} from "react";
import {KeyboardAvoidingView, Platform, Image, Text, View, StyleSheet, TextInput, Button} from "react-native";
import Swiper from 'react-native-web-swiper';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ImageDetailForm({route, navigation}) {
  const [comment, setComment] = useState('');

  const {photoInfo, albumList} = route.params;
  const index = albumList.findIndex((item) => item.photoKey === photoInfo.photoKey);
  const sendToComment = async () => {
    console.log('너냐?');
    const UserServerAccessToken = await AsyncStorage.getItem("UserServerAccessToken");
    const data = {
      photoId: photoInfo.photoId,
      comment: comment
    }

    try {
      const response = await fetch('http://43.202.241.133:12345/comment', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + UserServerAccessToken
        },
      });
      if (response.ok) {
        console.log("👂🏻 댓글 서버로 보내짐~~~~");
      } else {
        console.error("❌ 서버 응답 오류:", response.status);
      }
    } catch (error) {
      console.error("❌ 댓글 안올라감 ㅜㅜㅜ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Swiper
        controlsEnabled={true}
        from={index}
      >

        {albumList.map((item, index) => {
          const nowYear = new Date().getFullYear();
          const createDate = new Date(item.createAt);
          const year = createDate.getFullYear();
          const month = createDate.getMonth() + 1;
          const day = createDate.getDate();
          const hours = createDate.getHours();
          const minutes = createDate.getMinutes();
          const formattedDate = `${month}월 ${day}일 ${hours}:${minutes}`;

          return (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}
            >
              <View key={index} style={styles.slide}>
                <Text style={styles.date}>
                  {nowYear === year ? formattedDate : year + formattedDate}
                </Text>
                <Text style={styles.writer}>{item.writer}</Text>
                <Image style={styles.uploadImage} source={{uri: item.photoKey}} resizeMode="contain"/>
                <View style={styles.tagButtonsContainer}>
                  <Text style={styles.tagButton}>
                    {item.photoTags.map((tag, index) => (
                      <Text key={index} style={styles.tagText}>{tag}</Text>
                    ))}
                  </Text>
                </View>
                <Text style={styles.description}>설명: {item.description}</Text>

                <TextInput
                  value={comment}
                  style={styles.comment}
                  onChangeText={setComment}
                  placeholder="댓글..."
                />
                <Button
                  title='작성'
                  onPress={sendToComment}
                />
              </View>
            </KeyboardAvoidingView>
          );
        })}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadImage: {
    width: "80%",
    aspectRatio: 1,
    marginBottom: 20,
  },
  tag: {
    fontSize: 16,
    marginBottom: 10,
  },
  description: {
    fontSize: 20,

  },
  comment: {
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'gray',
    marginTop: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 16,
    borderRadius: 5,
    width: '50%',
  },
  writer: {
    fontWeight: "bold",

  },
  tagButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tagButton: {
    alignItems: 'center',
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#E0EBF2',
  },

});