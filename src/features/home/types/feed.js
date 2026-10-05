/** @typedef {{title:string, url:string, source:string, publishedAt:string|null}} Article */
/** @typedef {{date:string, min:number, max:number, rainProbability:number, code:number}} WeatherDay */
/** @typedef {{location:string, time:string, temperature:number, humidity:number, windSpeed:number, code:number, days:WeatherDay[]}} Weather */
/** @typedef {{fetchedAt:string, weather:Weather|null, headlines:Article[], logistics:Article[], unavailableSources:string[]}} HomeFeed */
export {};
