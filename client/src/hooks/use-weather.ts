import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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

export function getWeatherDescription(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear Sky", icon: "sun" };
  if (code <= 2) return { label: "Partly Cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code <= 49) return { label: "Foggy", icon: "cloud-fog" };
  if (code <= 55) return { label: "Drizzle", icon: "cloud-drizzle" };
  if (code <= 65) return { label: "Rain", icon: "cloud-rain" };
  if (code <= 67) return { label: "Freezing Rain", icon: "cloud-rain" };
  if (code <= 77) return { label: "Snow", icon: "snowflake" };
  if (code <= 82) return { label: "Rain Showers", icon: "cloud-rain" };
  if (code <= 99) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Unknown", icon: "cloud" };
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

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,windspeed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila&forecast_days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather");
  const data = await res.json();

  const currentCode = data.current.weathercode;
  const { label, icon } = getWeatherDescription(currentCode);

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      windspeed: Math.round(data.current.windspeed_10m),
      weatherCode: currentCode,
      description: label,
      icon,
    },
    daily: data.daily.time.map((date: string, i: number) => {
      const code = data.daily.weathercode[i];
      const { label, icon } = getWeatherDescription(code);
      return {
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: code,
        description: label,
        icon,
      };
    }),
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
    return PH_CITIES[0]; // Default: San Jose de Buenavista (ANTECO HQ)
  });

  const saveCity = (city: typeof PH_CITIES[0]) => {
    setSelectedCity(city);
    localStorage.setItem(STORAGE_KEY, city.name);
  };

  const { data, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["weather", selectedCity.lat, selectedCity.lon],
    queryFn: () => fetchWeather(selectedCity.lat, selectedCity.lon),
    staleTime: 1000 * 60 * 15, // refresh every 15 min
    retry: 2,
  });

  return { weather: data, isLoading, error, selectedCity, setSelectedCity: saveCity };
}
