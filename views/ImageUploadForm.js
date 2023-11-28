import {useState} from "react";
import {Button, View, Image, TextInput, StyleSheet, ScrollView} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import SelectBox from 'react-native-multi-selectbox'
import {xorBy} from "lodash";

const TAG_OPTION = [
  {
    item: '아빠',
    id: 'DAD',
  },
  {
    item: '엄마',
    id: 'MOM',
  },
  {
    item: '첫째',
    id: 'FIRST',
  },
  {
    item: '둘째',
    id: 'SECOND',
  },
  {
    item: '셋째',
    id: 'THIRD',
  },
  {
    item: '넷째',
    id: 'FORTH',
  },
  {
    item: '다섯째',
    id: 'FIFTH',
  },
  {
    item: '여섯째',
    id: 'SIXTH',
  },
  {
    item: '할아버지',
    id: 'GRANDFATHER',
  },
  {
    item: '할머니',
    id: 'GRANDMOTHER',
  },
  {
    item: '삼촌',
    id: 'UNCLE',
  },
]

export default function ImageUploadForm({uri, onUploadComplete}) {
  const [photoTags, setPhotoTags] = useState(['EXTRA'])
  const [description, setDescription] = useState('');

  // 클라에서 바로 presigned url로 업로드
  // 1단계: signed url을 요청해서 받는다.
  // 2단계: 받아온 url에 put으로 요청해서 업로드한다.
  const uploadToServer = async () => {
    const familyId = await AsyncStorage.getItem("familyId");
    const UserServerAccessToken = await AsyncStorage.getItem("UserServerAccessToken");

    // 서버로 전송될 파일의 이름과 타입 지정
    const body = {
      prefix: familyId,   // familyId
      fileName: uri.substring(uri.lastIndexOf('/') + 1),
    };

    try {
      // 1단계: 서버에 presigned url 요청
      const urlRes = await fetch('http://43.202.241.133:12345/photo/s3', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + UserServerAccessToken
        },
      });

      const signedUrl = await urlRes.text();
      // console.log("👉🏻presigned url: ", signedUrl);

      const blob = await (await fetch(uri)).blob();
      // console.log("📝 blob: ", blob)

      // 2단계: 이미지를 해당 url에 put (upload)
      // 이미 파일 이름이나 경로 등은 url 받아올 때 지정해놨으므로 image 파일 객체와 content-type 정보만 넣어서 보냄
      // const access_token = await AsyncStorage.getItem("ServerAccessToken");
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-type': "image/jpeg",
        },
      });

      // 서버 응답 확인
      // console.log("🚀 서버에 업로드 한 정보: ", uploadRes);

      // 서버 응답이 성공적인지 확인하고 필요한 처리 수행
      if (uploadRes.ok) {
        const writer = await AsyncStorage.getItem("nickname");
        const list = signedUrl.split('?')
        const imageInfo = {
          writer: writer,
          photoKey: familyId + '/' + list[0].substring(list[0].lastIndexOf('/') + 1),
          photoTags: photoTags,
          description: description,
        };
        // console.log(imageInfo);

        const response = await fetch('http://43.202.241.133:12345/photo', {
          method: 'POST',
          body: JSON.stringify(imageInfo),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + UserServerAccessToken
          },
        });
        console.log("👌🏻 이미지 업로드 성공");
        onUploadComplete();
      } else {
        console.error("❌ 이미지 업로드 실패");
      }
    } catch (err) {
      console.log("서버 업로드 에러..", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        style={styles.uploadImage}
        source={{uri: uri}}
        width={100}
        height={100}
        resizeMode="contain"
      />
      <View style={{height: 40}}/>
      <TextInput
        style={styles.input}
        value={photoTags.join(', ')}
        onChangeText={(text) =>
          setPhotoTags(text.split(',').map((tag) => tag.trim()))
        }
        placeholder="인물 태그..."
        multiline
      />
      <TextInput
        style={[styles.input, styles.description]}
        value={description}
        onChangeText={setDescription}
        placeholder="문구 입력..."
        multiline
      />
      <Button
        title="공유"
        onPress={uploadToServer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  description: {
    height: 80,
  },
});