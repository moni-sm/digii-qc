const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all origins

const DATA_FILE = path.join(__dirname, 'jobs.json');
const QAP_FILE = path.join(__dirname, 'qap.json');

function readJobs() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeJobs(jobs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

function readQAP() {
  try {
    const data = fs.readFileSync(QAP_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// --- JOBS CRUD ---

app.get('/jobs', (req, res) => {
  const jobs = readJobs();
  res.json(jobs);
});

app.get('/jobs/:id', (req, res) => {
  const jobs = readJobs();
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/jobs', (req, res) => {
  const jobs = readJobs();
  const newJob = req.body;

  newJob.id = (jobs.length + 1).toString();
  newJob.stages = newJob.stages || [];

  jobs.push(newJob);
  writeJobs(jobs);
  res.status(201).json(newJob);
});

app.put('/jobs/:id', (req, res) => {
  const jobs = readJobs();
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });

  const updatedJob = { ...jobs[index], ...req.body };
  jobs[index] = updatedJob;
  writeJobs(jobs);
  res.json(updatedJob);
});

app.delete('/jobs/:id', (req, res) => {
  let jobs = readJobs();
  const initialLength = jobs.length;
  jobs = jobs.filter(j => j.id !== req.params.id);
  if (jobs.length === initialLength) return res.status(404).json({ error: 'Job not found' });
  writeJobs(jobs);
  res.status(204).send();
});

// Stages endpoints
app.post('/jobs/:id/stages', (req, res) => {
  const jobs = readJobs();
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const newStage = req.body;
  job.stages = job.stages || [];
  job.stages.push(newStage);

  writeJobs(jobs);
  res.status(201).json(newStage);
});

app.put('/jobs/:jobId/stages/:stageNo', (req, res) => {
  const jobs = readJobs();
  const job = jobs.find(j => j.id === req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const stageIndex = job.stages.findIndex(s => s.stageNo.toString() === req.params.stageNo);
  if (stageIndex === -1) return res.status(404).json({ error: 'Stage not found' });

  job.stages[stageIndex] = { ...job.stages[stageIndex], ...req.body };
  writeJobs(jobs);
  res.json(job.stages[stageIndex]);
});

app.delete('/jobs/:jobId/stages/:stageNo', (req, res) => {
  const jobs = readJobs();
  const job = jobs.find(j => j.id === req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const initialLength = job.stages.length;
  job.stages = job.stages.filter(s => s.stageNo.toString() !== req.params.stageNo);
  if (job.stages.length === initialLength) return res.status(404).json({ error: 'Stage not found' });

  writeJobs(jobs);
  res.status(204).send();
});

// --- QAP READ-ONLY ENDPOINT ---
app.get('/qap', (req, res) => {
  const qaps = readQAP();
  res.json(qaps);
});

const PORT = 3000;

function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = startServer;
