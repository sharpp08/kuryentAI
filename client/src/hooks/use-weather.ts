import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const PH_CITIES = [
  { name: "San Jose de Buenavista", province: "Antique", lat: 10.7469, lon: 121.9344 },
  { name: "Kalibo", province: "Aklan", lat: 11.7076, lon: 122.3639 },
  { name: "Iloilo City", province: "Iloilo", lat: 10.7202, lon: 122.5621 },
  { name: "Bacolod", province: "Negros Occidental", lat: 10.6765, lon: 122.9509 },
  { name: "Manila", province: "Metro Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Quezon City", province: "Metro Manila", lat: 14.6760, lon: 121.0437 },
  { name: "Makati", province: "Metro Manila", lat: 14.5547, lon: 121.0244 },
  { name: "Cebu City", province: "Cebu", lat: 10.3157, lon: 123.8854 },
  { name: "Davao City", province: "Davao del Sur", lat: 7.1907, lon: 125.4553 },
  { name: "Cagayan de Oro", province: "Misamis Oriental", lat: 8.4542, lon: 124.6319 },
  { name: "Zamboanga City", province: "Zamboanga del Sur", lat: 6.9214, lon: 122.0790 },
  { name: "General Santos", province: "South Cotabato", lat: 6.1164, lon: 125.1716 },
  { name: "Antipolo", province: "Rizal", lat: 14.6260, lon: 121.1764 },
  { name: "Taguig", province: "Metro Manila", lat: 14.5176, lon: 121.0509 },
  { name: "Baguio City", province: "Benguet", lat: 16.4023, lon: 120.5960 },
  { name: "Legazpi City", province: "Albay", lat: 13.1391, lon: 123.7438 },
  { name: "Tacloban", province: "Leyte", lat: 11.2543, lon: 125.0000 },
];

function isRainingCode(code: number): boolean {
  const rainCodes = [
    176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308,
    311, 314, 317, 320, 353, 356, 359, 362, 365, 386, 389
  ];
  return rainCodes.includes(code);
}

function wwoCodeToInfo(code: number, isDay: boolean): { label: string; icon: string } {
  if (code === 113) {
    return isDay
      ? { label: "Clear Sky", icon: "sun" }
      : { label: "Clear Night", icon: "moon" };
  }
  if (code === 116) {
    return isDay
      ? { label: "Partly Cloudy", icon: "cloud-sun" }
      : { label: "Partly Cloudy", icon: "cloud-moon" };
  }
  if (code === 119 || code === 122) return { label: "Cloudy", icon: "cloud" };
  if (code === 143 || code === 248 || code === 260) return { label: "Foggy", icon: "cloud-fog" };
  if ([263, 266, 281, 284].includes(code)) return { label: "Drizzle", icon: "cloud-drizzle" };
  if ([176, 293, 296].includes(code)) return { label: "Light Rain", icon: "cloud-drizzle" };
  if ([299, 302, 305, 308, 353, 356, 359].includes(code)) return { label: "Rain", icon: "cloud-rain" };
  if ([311, 314, 317, 320, 362, 365].includes(code)) return { label: "Sleet", icon: "cloud-rain" };
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377].includes(code)) return { label: "Snow", icon: "snowflake" };
  if ([200, 386, 389, 392, 395].includes(code)) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Cloudy", icon: "cloud" };
}

function parseAstronomyTime(timeStr: string): { hour: number; minute: number } {
  const [time, period] = timeStr.trim().split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function computeIsDay(astronomy: { sunrise: string; sunset: string }): boolean {
  const now = new Date();
  const phHour = (now.getUTCHours() + 8) % 24;
  const phMinute = now.getUTCMinutes();
  const currentMinutes = phHour * 60 + phMinute;

  const rise = parseAstronomyTime(astronomy.sunrise);
  const set = parseAstronomyTime(astronomy.sunset);
  const riseMinutes = rise.hour * 60 + rise.minute;
  const setMinutes = set.hour * 60 + set.minute;

  return currentMinutes >= riseMinutes && currentMinutes < setMinutes;
}

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windspeed: number;
    weatherCode: number;
    description: string;
    icon: string;
    isDay: boolean;
    isRaining: boolean;
    sunrise: string;
    sunset: string;
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    description: string;
    icon: string;
    isRaining: boolean;
  }[];
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://wttr.in/${lat},${lon}?format=j1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid weather response");
  }

  if (!data.current_condition?.[0] || !data.weather?.[0]) {
    throw new Error("Unexpected weather data structure");
  }

  const cur = data.current_condition[0];
  const curCode = parseInt(cur.weatherCode, 10);
  const todayAstronomy = data.weather[0]?.astronomy?.[0];

  const isDay = todayAstronomy ? computeIsDay(todayAstronomy) : (new Date().getUTCHours() + 8) % 24 >= 6;
  const { label, icon } = wwoCodeToInfo(curCode, isDay);

  const daily = (data.weather as any[]).map((day) => {
    const midday = day.hourly?.[4] ?? day.hourly?.[0] ?? {};
    const code = parseInt(midday.weatherCode ?? "113", 10);
    const { label, icon } = wwoCodeToInfo(code, true);
    return {
      date: day.date ?? "",
      tempMax: parseInt(day.maxtempC ?? "0", 10),
      tempMin: parseInt(day.mintempC ?? "0", 10),
      weatherCode: code,
      description: label,
      icon,
      isRaining: isRainingCode(code),
    };
  });

  return {
    current: {
      temp: parseInt(cur.temp_C ?? "0", 10),
      feelsLike: parseInt(cur.FeelsLikeC ?? "0", 10),
      humidity: parseInt(cur.humidity ?? "0", 10),
      windspeed: parseInt(cur.windspeedKmph ?? "0", 10),
      weatherCode: curCode,
      description: label,
      icon,
      isDay,
      isRaining: isRainingCode(curCode),
      sunrise: todayAstronomy?.sunrise ?? "—",
      sunset: todayAstronomy?.sunset ?? "—",
    },
    daily,
  };
}

const STORAGE_KEY = "kuryentai_selected_city";

export function useWeather() {
  const [selectedCity, setSelectedCity] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = PH_CITIES.find(c => c.name === saved);
      if (found) return found;
    }
    return PH_CITIES[0];
  });

  const saveCity = (city: typeof PH_CITIES[0]) => {
    setSelectedCity(city);
    localStorage.setItem(STORAGE_KEY, city.name);
  };

  const { data, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["weather", selectedCity.lat, selectedCity.lon],
    queryFn: () => fetchWeather(selectedCity.lat, selectedCity.lon),
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 30,
    retry: 2,
  });

  return { weather: data, isLoading, error, selectedCity, setSelectedCity: saveCity };
}
