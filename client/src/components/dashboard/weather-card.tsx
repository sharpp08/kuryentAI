import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeather, PH_CITIES } from "@/hooks/use-weather";
import {
  Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudLightning,
  CloudFog, Snowflake, Wind, Droplets, Thermometer
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";

function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const props = { className: className || "h-8 w-8" };
  switch (icon) {
    case "sun": return <Sun {...props} />;
    case "cloud-sun": return <CloudSun {...props} />;
    case "cloud": return <Cloud {...props} />;
    case "cloud-rain": return <CloudRain {...props} />;
    case "cloud-drizzle": return <CloudDrizzle {...props} />;
    case "cloud-lightning": return <CloudLightning {...props} />;
    case "cloud-fog": return <CloudFog {...props} />;
    case "snowflake": return <Snowflake {...props} />;
    default: return <Cloud {...props} />;
  }
}

function getIconColor(icon: string) {
  switch (icon) {
    case "sun": return "text-yellow-400";
    case "cloud-sun": return "text-yellow-300";
    case "cloud-rain":
    case "cloud-drizzle": return "text-blue-400";
    case "cloud-lightning": return "text-purple-400";
    case "cloud-fog": return "text-gray-400";
    default: return "text-muted-foreground";
  }
}

function getDayLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tmrw";
  return format(date, "EEE");
}

export function WeatherCard() {
  const { weather, isLoading, selectedCity, setSelectedCity } = useWeather();

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="p-4 md:p-6 pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base md:text-lg">Live Weather</CardTitle>
        <Select
          value={selectedCity.name}
          onValueChange={(val) => {
            const city = PH_CITIES.find(c => c.name === val);
            if (city) setSelectedCity(city);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs bg-secondary border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {PH_CITIES.map(city => (
              <SelectItem key={city.name} value={city.name} className="text-xs">
                {city.name}, {city.province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-3 mt-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-16 rounded-xl" />
              ))}
            </div>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            {/* Current weather */}
            <div className="flex items-center gap-4">
              <div className={getIconColor(weather.current.icon)}>
                <WeatherIcon icon={weather.current.icon} className="h-14 w-14" />
              </div>
              <div>
                <div className="text-4xl font-bold font-display leading-none">
                  {weather.current.temp}°C
                </div>
                <div className="text-sm text-muted-foreground mt-1">{weather.current.description}</div>
                <div className="text-xs text-muted-foreground">{selectedCity.name}, {selectedCity.province}</div>
              </div>
              <div className="ml-auto grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                  Feels {weather.current.feelsLike}°C
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  {weather.current.humidity}% humidity
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-cyan-400" />
                  {weather.current.windspeed} km/h
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {weather.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl bg-secondary/50 border border-border/40 px-3 py-2.5 min-w-[62px]"
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {getDayLabel(day.date)}
                  </span>
                  <div className={getIconColor(day.icon)}>
                    <WeatherIcon icon={day.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">{day.tempMax}°C</span>
                  <span className="text-[10px] text-muted-foreground">{day.tempMin}°C</span>
                  <span className="text-[9px] text-muted-foreground/70 text-center leading-tight mt-0.5 line-clamp-1">
                    {day.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Weather tip for energy use */}
            {weather.current.temp >= 32 && (
              <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 text-orange-400">
                🌡️ It's hot today ({weather.current.temp}°C) — expect higher aircon usage and a bigger bill.
              </div>
            )}
            {weather.current.temp <= 24 && (
              <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-blue-400">
                😎 Cool weather today ({weather.current.temp}°C) — great time to turn off the aircon and save!
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load weather data.</p>
        )}
      </CardContent>
    </Card>
  );
}
