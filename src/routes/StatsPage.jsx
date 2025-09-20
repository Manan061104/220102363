import React, { useEffect, useState } from "react";
import { Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Collapse, IconButton, Box } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { stats } from "../services/api.js";

function Row({ row }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell>{row.shortUrl}</TableCell>
        <TableCell>{row.url}</TableCell>
        <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
        <TableCell>{new Date(row.expiresAt).toLocaleString()}</TableCell>
        <TableCell>{row.totalClicks}</TableCell>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2 }}>
              {row.clicks.map((c, idx) => (
                <Typography key={idx} variant="body2">
                  {new Date(c.ts).toLocaleString()} — source: {c.source}, geo: {c.geo}
                </Typography>
              ))}
              {row.clicks.length === 0 && <Typography variant="body2">No clicks yet</Typography>}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function StatsPage() {
  const [data, setData] = useState([]);
  useEffect(() => { stats().then(setData).catch(() => setData([])); }, []);
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Statistics</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Short URL</TableCell>
              <TableCell>Original URL</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Clicks</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => <Row key={row.code} row={row} />)}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
