import React, {Fragment, useEffect, useState} from "react";
import {View, Text, StyleSheet, Pressable, Platform, ActionSheetIOS, FlatList, Image} from "react-native";
import {ImagePlus} from "lucide-react-native";
import UploadModeModal from "../components/UploadModeModal";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageUploadForm from "./ImageUploadForm";
import * as url from "url";

export default function AlbumScreen({navigation}) {
  // 카메라 권한 요청을 위한 훅
  const [cameraStatus, cameraRequestPermission] = ImagePicker.useCameraPermissions();
  // 앨범 권한 요청을 위한 훅
  const [albumStatus, albumRequestPermission] = ImagePicker.useMediaLibraryPermissions();
  // 선택한 이미지 객체 저장
  const [chosenImage, setChosenImage] = useState('');
  // 안드로이드를 위한 모달 visible 상태값
  const [modalVisible, setModalVisible] = useState(false);
  // 앨범에 보여줄 이미지 목록 (s3에서 불러온 이미지들)
  const [imageData, setImageData] = useState([]);
  // 이미지 올리는 form
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleUploadComplete = () => {
    setShowUploadForm(false);
  }

  useEffect(() => {
    // 서버에서 s3 이미지 url 받아옴
    const fetchData = async () => {
      const familyId = await AsyncStorage.getItem("familyId");
      const photoId = ' ';

      try {
        const response = await fetch(`http://43.202.241.133:8080/photo/list/901/${photoId}`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NTEiLCJhdXRoIjoiUk9MRV9VU0VSIiwiZmFtaWx5IjoiNTM1IiwiZXhwIjoxNzAxMjA1NTc5fQ.-TPkx6HuGSZy9-wSpsJrLFGrUuxYK8NYImOMl5RP2fk`,
          },
        });

        const data = await response.json();
        // 받아온 이미지 데이터 상태에 저장
        setImageData(data.data);
        console.log(data.data)
        console.log("👉🏻앨범 이미지 리스트: ", data.data.map(item => item.photoKey));
      } catch (error) {
        console.error("이미지 url을 가져오는 중에 오류가 발생했습니다.", error);
      }
    };
    // 이미지 업로드가 완료되면 이미지 데이터를 다시 불러옴
    if (!showUploadForm) {
      fetchData();
    }
  }, [showUploadForm]);

  const imagePickerOption = {
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 1,
    aspect: [1, 1],
    includeBase64: Platform.OS === "android",
  };

  // 선택 모달 오픈
  const modalOpen = () => {
    if (Platform.OS === "android") {
      setModalVisible(true);
    } else {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["사진 찍기", "카메라롤에서 선택하기", "취소"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onLaunchCamera();
          } else if (buttonIndex === 1) {
            onLaunchImageLibrary();
          }
        }
      )
    }
  }

  // 카메라 촬영
  const onLaunchCamera = async () => {
    try {
      // 권한 확인 (권한 없으면 물어보고, 승인하지 않으면 함수 종료)
      if (!cameraStatus?.granted) {
        const cameraPermission = await cameraRequestPermission();
        if (!cameraPermission.granted) {
          return null;
        }
      } else {
        // 이미지 결과 (화면용, 실제로 s3에 업로드 한 이미지 아님)
        const result = await ImagePicker.launchCameraAsync(imagePickerOption);
        // 이미지 업로드 취소한 경우
        if (result.canceled) {
          return null;
        }
        // 이미지 업로드 결과 및 이미지 경로 업데이트
        if (result.assets && result.assets.length > 0) {
          const chosenImage = result.assets[0];
          setChosenImage(chosenImage);
          console.log("🌄 저장한 이미지 -> ", chosenImage);
          setShowUploadForm(true);
          // ImageUploadForm(chosenImage.uri); // 이미지 선택 후 폼 작성 + 서버로 업로드
        } else {
          console.log("No assets found!");
        }
      }
    } catch (error) {
      console.error("카메라 Error!!!!! : ", error);
    }
  }

  // 갤러리에서 사진 선택
  const onLaunchImageLibrary = async () => {
    try {
      // 권한 확인 (권한 없으면 물어보고, 승인하지 않으면 함수 종료)
      if (!albumStatus?.granted) {
        const albumPermission = await albumRequestPermission();
        if (!albumPermission.granted) {
          return null;
        }
      } else {
        // 이미지 선택 (화면용, 실제로 s3에 업로드 한 이미지 아님)
        const result = await ImagePicker.launchImageLibraryAsync(imagePickerOption);
        // 이미지 업로드 취소한 경우
        if (result.canceled) {
          return null;
        }
        // 이미지 업로드 결과 및 이미지 경로 업데이트
        if (result.assets && result.assets.length > 0) {
          const chosenImage = result.assets[0];
          setChosenImage(chosenImage);
          console.log("🌄 저장한 이미지 -> ", chosenImage);
          setShowUploadForm(true);
          // ImageUploadForm({uri}); // 이미지 선택 후 폼 작성 + 서버로 업로드
        } else {
          console.log("No assets found!");
        }
      }
    } catch (error) {
      console.error("갤러리 Error!!!!! : ", error);
    }
  }

  return (
    <View style={styles.container}>
      {!showUploadForm ? (
        <Fragment>
          <FlatList
            numColumns={4}
            data={imageData}
            keyExtractor={(item) => item.photoId.toString()}
            renderItem={({item}) => (
              <View style={styles.imageContainer}>
                <Image
                  source={{uri: item.photoKey}}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            )}
          />
          <Pressable
            style={styles.imagePlusContainer}
            onPress={modalOpen}>
            <ImagePlus
              color="navy"
              size={40}
            />
          </Pressable>
        </Fragment>
      ) : (
        <ImageUploadForm uri={chosenImage.uri} onUploadComplete={handleUploadComplete}/>
      )}
      <UploadModeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onLaunchCamera={onLaunchCamera}
        onLaunchImageLibrary={onLaunchImageLibrary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "contain",
    width: 150, // 이미지의 가로 크기
    height: 150, // 이미지의 세로 크기
    margin: 4, // 이미지 간의 간격 조절
  },
  imagePlusContainer: {
    position: "absolute",
    top: "2%", // 아래 여백 조절
    right: "3%", // 오른쪽 여백 조절
  },
  imageContainer: {
    margin: 4,
  }
});
