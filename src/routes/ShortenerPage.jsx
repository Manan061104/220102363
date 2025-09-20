import React, { useState } from "react";
import {
  Container, Box, Typography, Paper, Grid, TextField, Button, Alert, Link,
} from "@mui/material";
import { createBatch } from "../services/api.js";

const emptyRow = () => ({ url: "", minutes: "", code: "" });

export default function ShortenerPage() {
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  function validate(r) {
    try {
      // URL format
      const u = new URL(r.url);
      if (!u.protocol.startsWith("http")) throw new Error("Invalid URL");
      // minutes integer if provided
      if (r.minutes !== "" && !/^\d+$/.test(String(r.minutes))) throw new Error("Minutes must be integer");
      // shortcode format if provided
      if (r.code && !/^[a-zA-Z0-9]{3,20}$/.test(r.code)) throw new Error("Shortcode must be 3-20 alphanumerics");
      return null;
    } catch (e) {
      return e.message;
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResults([]);
    const toSend = [];
    for (const r of rows) {
      if (!r.url) continue;
      const v = validate(r);
      if (v) { setError(v); return; }
      toSend.push({ url: r.url, minutes: r.minutes === "" ? undefined : Number(r.minutes), code: r.code || undefined });
    }
    if (toSend.length === 0) { setError("Enter at least one URL"); return; }
    try {
      const res = await createBatch(toSend);
      setResults(res);
    } catch (err) {
      setError(err.message || "Error");
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>URL Shortener</Typography>
      <Paper sx={{ p: 2 }}>
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={2}>
            {rows.map((r, i) => (
              <React.Fragment key={i}>
                <Grid item xs={12} md={6}>
                  <TextField label="Original URL" fullWidth value={r.url}
                    onChange={(e) => { const v = [...rows]; v[i].url = e.target.value; setRows(v); }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Validity (min)" fullWidth value={r.minutes}
                    placeholder="30" inputMode="numeric"
                    onChange={(e) => { const v = [...rows]; v[i].minutes = e.target.value; setRows(v); }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Custom shortcode" fullWidth value={r.code}
                    onChange={(e) => { const v = [...rows]; v[i].code = e.target.value; setRows(v); }}
                  />
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              {error && <Alert severity="error">{error}</Alert>}
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained">Create Short Links</Button>
              <Button href="/stats" sx={{ ml: 2 }}>View Stats</Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {results.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Results</Typography>
          {results.map((r) => (
            <Box key={r.code} sx={{ mb: 1 }}>
              <Typography>
                <b>{r.code}</b> — <Link href={r.shortUrl}>{r.shortUrl}</Link> (expires {new Date(r.expiresAt).toLocaleString()})
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
}
