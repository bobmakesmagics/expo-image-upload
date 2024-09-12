import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const imgDir = FileSystem.documentDirectory + "images/";

const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imgDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
  }
};

export default function App() {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(imgDir);
    if (files.length > 0) {
      setImages(files.map((f) => imgDir + f));
    }
  };

  const selectImage = async (useLibraty: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    };

    if (useLibraty) {
      result = await ImagePicker.launchImageLibraryAsync(options);
    } else {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(options);
    }

    if (!result.canceled) {
      saveImages(result.assets[0].uri);
    }
  };

  const saveImages = async (uri: string) => {
    await ensureDirExists();
    const filename = new Date().getTime() + ".jpeg";
    const dest = imgDir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    setImages([...images, dest]);
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);

    const formData = new FormData();
    const filename = uri.split("/").pop();

    formData.append("file", {
      uri, // URI of the image
      name: filename, // Name of the file
      type: "image/jpeg", // Adjust based on your image type (e.g., 'image/png')
    } as any); // Use 'as any' to bypass TypeScript error

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const result = await response.json();
      console.log(result); // You can handle the result as needed
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (uri: string) => {
    await FileSystem.deleteAsync(uri);
    setImages(images.filter((i) => i !== uri));
  };

  const renderItem = ({ item }: { item: any }) => {
    const filename = item.split("/").pop();

    return (
      <View className="flex flex-row m-px items-cneter gap-[5px]">
        <Image className="w-20 h-20" source={{ uri: item }} />
        <Text className="flex-1">{filename}</Text>
        <Ionicons.Button
          name="cloud-upload"
          onPress={() => uploadImage(item)}
        />
        <Ionicons.Button name="trash" onPress={() => deleteImage(item)} />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 gap-5 pt-12">
      <View className="flex flex-row justify-evenly my-5">
        <Button title="Photo Library" onPress={() => selectImage(true)} />
        <Button title="Capture Image" onPress={() => selectImage(false)} />
      </View>

      <Text className="text-center text-xl font-medium">My Images</Text>
      <FlatList data={images} renderItem={renderItem} />

      {uploading && (
        <View className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}
