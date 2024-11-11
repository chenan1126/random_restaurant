import React, { useState } from "react";
import { useLoadScript, GoogleMap } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, DollarSign, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface selectedRestaurant {
  name: string | undefined;
  formatted_address: string;
  price_level: number;
  rating: number;
  user_ratings_total: number;
  formatted_phone_number: string;
  opening_hours?: {
    open_now?: boolean | undefined;
  };
  website: string;
}

// 地圖樣式設定
const mapContainerStyle = {
  width: "100%",
  height: "300px",
  marginBottom: "1rem",
  borderRadius: "0.5rem",
};

const center = {
  lat: 25.033, // 台北市預設位置
  lng: 121.565,
};

const RestaurantPicker = () => {
  // Google Maps API 載入狀態
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyAiaLHGDca9R-OWkvXXm_DzY7vox1dIxPo", // 請替換為您的API金鑰
    libraries: ["places"],
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [priceRange, setPriceRange] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<selectedRestaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setRestaurants] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [customCuisine, setCustomCuisine] = useState("");

  // 獲取當前位置
  const getCurrentLocation = () => {
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          if (map) {
            map.panTo(newLocation);
          }
        },
        (error) => {
          setError("無法獲取位置信息：" + error.message);
        }
      );
    } else {
      setError("您的瀏覽器不支持地理位置功能");
    }
  };

  const handleCustomCuisineChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomCuisine(e.target.value);
  };

  const addCustomCuisine = () => {
    if (customCuisine) {
      setCuisine(customCuisine);
      setCustomCuisine(""); // 清空輸入框
    }
  };
  // 搜尋附近餐廳
  const searchNearbyRestaurants = async () => {
    if (!location || !map) return;

    setLoading(true);
    setError(null);

    const service = new window.google.maps.places.PlacesService(map);
    const cuisineKeyword = cuisine ? getCuisineKeyword(cuisine) : customCuisine || undefined;

    // 建立搜尋請求
    const request = {
      location: location,
      radius: 1500, // 搜尋半徑（公尺）
      type: "restaurant",
      price_level: priceRange ? parseInt(priceRange) : undefined,
      keyword: cuisineKeyword,
    };
    {console.log(cuisine)};
    try {
      const results: google.maps.places.PlaceResult[] = await new Promise(
        (resolve, reject) => {
          service.nearbySearch(request, (results, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              resolve(results);
            } else {
              reject(new Error("搜尋餐廳失敗"));
            }
          });
        }
      );

      setRestaurants(results);

      // 隨機選擇一家餐廳
      if (results.length > 0) {
        const randomIndex = Math.floor(Math.random() * results.length);
        const selected = results[randomIndex];

        // 獲取更詳細的餐廳信息
        if (selected.place_id) {
          service.getDetails(
            { placeId: selected.place_id },
            (place, status) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                place
              ) {
                // 轉換成 selectedRestaurant 格式
                const restaurant: selectedRestaurant = {
                  name: place.name || "無名稱",
                  formatted_address: place.formatted_address || "無地址",
                  price_level: place.price_level || 1,
                  rating: place.rating || 0,
                  user_ratings_total: place.user_ratings_total || 0,
                  formatted_phone_number:
                    place.formatted_phone_number || "無電話",
                  opening_hours: place.opening_hours || { open_now: false },
                  website: place.website || "無網站",
                };
                if (place.geometry?.location) {
                  setSelectedRestaurant(restaurant);
                  // 移動地圖到選中的餐廳位置
                  map.panTo(place.geometry.location);
                }
              }
            }
          );
        } else {
          setError("找不到符合條件的餐廳");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("未知錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  // 將選擇的料理類型轉換為搜尋關鍵字
  const getCuisineKeyword = (cuisine: string) => {
    const keywords = {
      chinese: "中式餐廳",
      japanese: "日本料理",
      western: "西式餐廳",
      korean: "韓式料理",
    };
  
    if (cuisine === "custom" && customCuisine) {
      return customCuisine; // 返回自訂的類型
    }
  
    return keywords[cuisine as keyof typeof keywords] || ""; // 如果是已定義的類型，返回相對應的關鍵字
  };

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>地圖載入失敗</AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return <div className="text-center p-4">載入中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>餐廳隨機選擇器</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 地圖顯示區域 */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={location || center}
            onLoad={(map) => setMap(map)}
          />

          <div className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={getCurrentLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                獲取當前位置
              </Button>
              {location && (
                <span className="text-sm text-green-600">位置已獲取</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇價格範圍" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">$ (正常吃)</SelectItem>
                  <SelectItem value="2">$$ (有點貴)</SelectItem>
                  <SelectItem value="3">$$$ (吃好料)</SelectItem>
                  <SelectItem value="4">$$$$ (最頂的)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇餐廳類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chinese">中式料理</SelectItem>
                  <SelectItem value="japanese">日本料理</SelectItem>
                  <SelectItem value="western">西式料理</SelectItem>
                  <SelectItem value="korean">韓式料理</SelectItem>
                  <SelectItem value="custom">自訂(在下方輸入)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label>找不到想要的類型嗎?</Label>
              <div className="flex gap-2">
                <Input
                  id="custom"
                  placeholder="輸入你想要的類型"
                  value={customCuisine}
                  onChange={handleCustomCuisineChange}
                />
                <Button onClick={addCustomCuisine}>加入自訂類型</Button>
              </div>
            </div>
            <div><Label>當前關鍵字：{cuisine}</Label></div>
            <Button
              onClick={searchNearbyRestaurants}
              className="w-full"
              disabled={!location || loading}
            >
              {loading ? "搜尋中..." : "隨機選擇餐廳"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {selectedRestaurant && (
        <Card>
          <CardHeader>
            <CardTitle>推薦餐廳</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xl font-bold">{selectedRestaurant.name}</p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedRestaurant.formatted_address}
              </p>
              <p className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {"$".repeat(selectedRestaurant.price_level || 1)}
              </p>
              <p className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                {selectedRestaurant.rating} / 5 (
                {selectedRestaurant.user_ratings_total} 則評價)
              </p>
              {selectedRestaurant.formatted_phone_number && (
                <p>電話: {selectedRestaurant.formatted_phone_number}</p>
              )}
              {selectedRestaurant.opening_hours && (
                <p>
                  營業狀態:{" "}
                  {selectedRestaurant.opening_hours.open_now
                    ? "營業中"
                    : "已打烊"}
                </p>
              )}
              {selectedRestaurant.website && (
                <a
                  href={selectedRestaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  查看網站
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RestaurantPicker;
