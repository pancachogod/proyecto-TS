import axios from "axios";

export const getSouthAmericaTime = async () => {
  const res = await axios.get("http://worldtimeapi.org/api/timezone/America/Bogota");
  return res.data; // retorna fecha, hora, UTC, etc.
};
