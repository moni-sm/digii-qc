const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

function getDataPath(filename) {
  return path.join(__dirname, 'data', filename);
}

const DATA_FILE = getDataPath('jobs.json');
const QAP_FILE = getDataPath('qap.json');

async function ensureDataDirectory() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error creating data directory:', err);
    }
  }
}

async function initializeDataFiles() {
  await ensureDataDirectory();

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(QAP_FILE);
  } catch {
    const defaultQAP = [
      { department: "QCE", qapNumber: "QCE74MQAPBEF001" },
      // add other default QAP entries here
    ];
    await fs.writeFile(QAP_FILE, JSON.stringify(defaultQAP, null, 2));
  }
}

async function readJobs() {
  try {
    await initializeDataFiles();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading jobs:', err);
    return [];
  }
}

async function writeJobs(jobs) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2));
  } catch (err) {
    console.error('Error writing jobs:', err);
    throw err;
  }
}

async function readQAP() {
  try {
    await initializeDataFiles();
    const data = await fs.readFile(QAP_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading QAP:', err);
    return [];
  }
}

// JOBS CRUD
app.get('/jobs', async (req, res) => {
  const jobs = await readJobs();
  res.json(jobs);
});

app.get('/jobs/:id', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/jobs', async (req, res) => {
  const jobs = await readJobs();
  const newJob = req.body;

  newJob.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  newJob.stages = newJob.stages || [];
  newJob.createdAt = new Date().toISOString();
  newJob.updatedAt = newJob.createdAt;

  jobs.push(newJob);
  await writeJobs(jobs);
  res.status(201).json(newJob);
});

app.put('/jobs/:id', async (req, res) => {
  const jobs = await readJobs();
  const index = jobs.findIndex(j => j.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });

  const updatedJob = { ...jobs[index], ...req.body, updatedAt: new Date().toISOString() };
  jobs[index] = updatedJob;
  await writeJobs(jobs);
  res.json(updatedJob);
});

app.delete('/jobs/:id', async (req, res) => {
  let jobs = await readJobs();
  const originalLength = jobs.length;
  jobs = jobs.filter(j => j.id !== req.params.id);
  if (jobs.length === originalLength) return res.status(404).json({ error: 'Job not found' });
  await writeJobs(jobs);
  res.status(204).send();
});

// STAGES CRUD
app.post('/jobs/:id/stages', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const newStage = { ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  job.stages = job.stages || [];

  if (job.stages.some(s => s.stageNo === newStage.stageNo)) {
    return res.status(409).json({ error: 'Stage number already exists' });
  }

  job.stages.push(newStage);
  job.updatedAt = new Date().toISOString();

  await writeJobs(jobs);
  res.status(201).json(newStage);
});

app.put('/jobs/:jobId/stages/:stageNo', async (req, res) => {
  try {
    const jobs = await readJobs();
    const job = jobs.find(j => j.id === req.params.jobId);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Convert stageNo to number for comparison
    const stageNo = parseInt(req.params.stageNo);
    const stageIndex = job.stages.findIndex(s => s.stageNo === stageNo);

    if (stageIndex === -1) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    job.stages[stageIndex] = {
      ...job.stages[stageIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    job.updatedAt = new Date().toISOString();

    await writeJobs(jobs);
    res.json(job.stages[stageIndex]);

  } catch (err) {
    console.error('Error updating stage:', err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

app.delete('/jobs/:jobId/stages/:stageNo', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find(j => j.id === req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const originalLength = job.stages.length;
  job.stages = job.stages.filter(s => s.stageNo.toString() !== req.params.stageNo);
  if (job.stages.length === originalLength) return res.status(404).json({ error: 'Stage not found' });

  job.updatedAt = new Date().toISOString();

  await writeJobs(jobs);
  res.status(204).send();
});

// QAP CRUD
app.get('/qap', async (req, res) => {
  const qaps = await readQAP();
  res.json(qaps);
});

app.get('/qap/:qapNumber', async (req, res) => {
  const qaps = await readQAP();
  const qap = qaps.find(q => q.qapNumber === req.params.qapNumber);
  if (!qap) return res.status(404).json({ error: 'QAP not found' });
  res.json(qap);
});

app.post('/qap', async (req, res) => {
  const qaps = await readQAP();
  const newQAP = req.body;

  if (!newQAP.department || !newQAP.qapNumber) {
    return res.status(400).json({ error: 'Department and qapNumber are required' });
  }

  if (qaps.find(q => q.qapNumber === newQAP.qapNumber)) {
    return res.status(409).json({ error: 'QAP with this qapNumber already exists' });
  }

  newQAP.createdAt = new Date().toISOString();
  newQAP.updatedAt = newQAP.createdAt;

  qaps.push(newQAP);
  await fs.writeFile(QAP_FILE, JSON.stringify(qaps, null, 2));
  res.status(201).json(newQAP);
});

app.put('/qap/:qapNumber', async (req, res) => {
  const qaps = await readQAP();
  const index = qaps.findIndex(q => q.qapNumber === req.params.qapNumber);
  if (index === -1) return res.status(404).json({ error: 'QAP not found' });

  const updatedQAP = { ...qaps[index], ...req.body, qapNumber: qaps[index].qapNumber, updatedAt: new Date().toISOString() };
  qaps[index] = updatedQAP;

  await fs.writeFile(QAP_FILE, JSON.stringify(qaps, null, 2));
  res.json(updatedQAP);
});

app.delete('/qap/:qapNumber', async (req, res) => {
  let qaps = await readQAP();
  const originalLength = qaps.length;
  qaps = qaps.filter(q => q.qapNumber !== req.params.qapNumber);
  if (qaps.length === originalLength) return res.status(404).json({ error: 'QAP not found' });

  await fs.writeFile(QAP_FILE, JSON.stringify(qaps, null, 2));
  res.status(204).send();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
