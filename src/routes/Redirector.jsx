import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, CircularProgress } from "@mui/material";
import { resolve } from "../services/api.js";

export default function Redirector() {
  const { code } = useParams();
  useEffect(() => {
    // Coarse source and geo can be expanded if backend provides it.
    resolve(code, { source: document.referrer || "direct", geo: "coarse" })
      .then(({ url }) => { window.location.replace(url); })
      .catch(() => {});
  }, [code]);
  return (
    <Container sx={{ mt: 8, textAlign: "center" }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Redirecting…</Typography>
    </Container>
  );
}
