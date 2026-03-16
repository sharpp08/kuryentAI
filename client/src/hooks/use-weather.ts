import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const PH_CITIES = [
  { name: "San Jose de Buenavista", province: "Antique", query: "San+Jose+de+Buenavista,Antique,Philippines" },
  { name: "Kalibo", province: "Aklan", query: "Kalibo,Aklan,Philippines" },
  { name: "Iloilo City", province: "Iloilo", query: "Iloilo+City,Philippines" },
  { name: "Bacolod", province: "Negros Occidental", query: "Bacolod,Philippines" },
  { name: "Manila", province: "Metro Manila", query: "Manila,Philippines" },
  { name: "Quezon City", province: "Metro Manila", query: "Quezon+City,Philippines" },
  { name: "Makati", province: "Metro Manila", query: "Makati,Philippines" },
  { name: "Cebu City", province: "Cebu", query: "Cebu+City,Philippines" },
  { name: "Davao City", province: "Davao del Sur", query: "Davao+City,Philippines" },
  { name: "Cagayan de Oro", province: "Misamis Oriental", query: "Cagayan+de+Oro,Philippines" },
  { name: "Zamboanga City", province: "Zamboanga del Sur", query: "Zamboanga+City,Philippines" },
  { name: "General Santos", province: "South Cotabato", query: "General+Santos,Philippines" },
  { name: "Antipolo", province: "Rizal", query: "Antipolo,Philippines" },
  { name: "Taguig", province: "Metro Manila", query: "Taguig,Philippines" },
  { name: "Baguio City", province: "Benguet", query: "Baguio+City,Philippines" },
  { name: "Legazpi City", province: "Albay", query: "Legazpi+City,Philippines" },
  { name: "Tacloban", province: "Leyte", query: "Tacloban,Philippines" },
];

function wwoCodeToInfo(code: number): { label: string; icon: string } {
  if (code === 113) return { label: "Clear Sky", icon: "sun" };
  if (code === 116) return { label: "Partly Cloudy", icon: "cloud-sun" };
  if (code === 119 || code === 122) return { label: "Cloudy", icon: "cloud" };
  if (code === 143 || code === 248 || code === 260) return { label: "Foggy", icon: "cloud-fog" };
  if ([176, 293, 296].includes(code)) return { label: "Light Rain", icon: "cloud-drizzle" };
  if ([263, 266, 281, 284].includes(code)) return { label: "Drizzle", icon: "cloud-drizzle" };
  if ([299, 302, 305, 308, 353, 356, 359].includes(code)) return { label: "Rain", icon: "cloud-rain" };
  if ([311, 314, 317, 320, 362, 365].includes(code)) return { label: "Sleet", icon: "cloud-rain" };
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377].includes(code)) return { label: "Snow", icon: "snowflake" };
  if ([200, 386, 389, 392, 395].includes(code)) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Cloudy", icon: "cloud" };
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
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    description: string;
    icon: string;
  }[];
}

async function fetchWeather(query: string): Promise<WeatherData> {
  const url = `https://wttr.in/${query}?format=j1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather");
  const data = await res.json();

  const cur = data.current_condition[0];
  const curCode = parseInt(cur.weatherCode, 10);
  const { label, icon } = wwoCodeToInfo(curCode);

  const daily = data.weather.map((day: any) => {
    const midday = day.hourly[4] ?? day.hourly[0];
    const code = parseInt(midday.weatherCode, 10);
    const { label, icon } = wwoCodeToInfo(code);
    return {
      date: day.date,
      tempMax: parseInt(day.maxtempC, 10),
      tempMin: parseInt(day.mintempC, 10),
      weatherCode: code,
      description: label,
      icon,
    };
  });

  return {
    current: {
      temp: parseInt(cur.temp_C, 10),
      feelsLike: parseInt(cur.FeelsLikeC, 10),
      humidity: parseInt(cur.humidity, 10),
      windspeed: parseInt(cur.windspeedKmph, 10),
      weatherCode: curCode,
      description: label,
      icon,
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
    queryKey: ["weather", selectedCity.query],
    queryFn: () => fetchWeather(selectedCity.query),
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 30,
    retry: 2,
  });

  return { weather: data, isLoading, error, selectedCity, setSelectedCity: saveCity };
}
