import React, {Fragment, useEffect, useState} from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActionSheetIOS,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {ImagePlus} from "lucide-react-native";
import UploadModeModal from "../components/UploadModeModal";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageUploadForm from "./ImageUploadForm";
import Checkbox from 'expo-checkbox';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    item: '기타',
    id: 'EXTRA',
  },
]

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
  // 선택한 태그
  const [selectedTags, setSelectedTags] = useState([]);
  const [albumList, setAlbumList] = useState([]);

  const handleUploadComplete = () => {
    setShowUploadForm(false);
  }

  useEffect(() => {
    // 서버에서 s3 이미지 url 받아옴
    const fetchData = async () => {
      const UserServerAccessToken = await AsyncStorage.getItem("UserServerAccessToken");
      try {
        const response = await fetch(`http://43.202.241.133:12345/photo/list`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + UserServerAccessToken,
          },
        });

        const data = await response.json();
        // 받아온 이미지 데이터 상태에 저장
        setImageData(data.data);
        setAlbumList(data.data);
        console.log("받은 데이터!!!!!!!!!", data.data)
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
          // console.log("🌄 저장한 이미지 -> ", chosenImage);
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
          // console.log("🌄 저장한 이미지 -> ", chosenImage);
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

  const toggleTagSelection = (tagId) => {
    setSelectedTags((prevTags) => {
      const isSelected = prevTags.includes(tagId);
      if (isSelected) {
        return prevTags.filter((tag) => tag !== tagId);
      } else {
        return [...prevTags, tagId];
      }
    });
    // console.log("선택한 태그:", selectedTags);
  };


  const filterImages = () => {
    // console.log("선택한 태그:", selectedTags);

    if (selectedTags.length === 0) {
      return imageData;
    }

    const filteredImages = imageData.filter((item) => {
      const hasMatchingTag = item.photoTags.some((tag) => selectedTags.includes(tag));
      console.log(`Item ${item.photoId} - hasMatchingTag: ${hasMatchingTag}`);
      return hasMatchingTag;
    });

    console.log("필터된 사진:", filteredImages);
    return filteredImages;
  }


  useEffect(() => {
    console.log("선택한 태그 (useEffect):", selectedTags);
  }, [selectedTags]);

  return (
    <View style={styles.container}>
      {!showUploadForm ? (
        <Fragment>
          <View style={styles.tagContainer}>
            {TAG_OPTION.map((tag) => (
              <View style={styles.tagItem} key={tag.id}>
                <Checkbox
                  value={selectedTags.includes(tag.id)}
                  onValueChange={() => toggleTagSelection(tag.id)}
                />
                <TouchableOpacity
                  onPress={() => toggleTagSelection(tag.id)}>
                  <Text>{tag.item}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <FlatList
            numColumns={4}
            data={filterImages()}
            keyExtractor={(item) => item.photoId.toString()}
            renderItem={({item}) => (
              <View style={styles.imageContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ImageDetailForm", {
                    photoInfo: {
                      photoId: item.photoId,
                      createAt: item.createAt,
                      photoKey: item.photoKey,
                      photoTags: item.photoTags,
                      description: item.description,
                      writer: item.writer,
                    },
                    albumList: albumList,
                  })}>
                  <Image
                    source={{uri: item.photoKey}}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
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
    width: SCREEN_WIDTH / 4 - 7, // 이미지의 가로 크기 (한 행에 4개씩 배치하고 간격 조절)
    height: SCREEN_WIDTH / 4 - 7, // 이미지의 세로 크기
  },
  imagePlusContainer: {
    position: "absolute",
    bottom: "2%",
    right: "3%",
  },
  imageContainer: {
    top: "1%",
    margin: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tagItem: {
    alignItems: 'center',
  },
});
