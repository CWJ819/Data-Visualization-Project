# Backend Setup Guide

## Prerequisites

- Anaconda installed
- Windows 10/11

## Environment Setup

### 1. Create conda environment

```bash
cd backend
conda create -n vis python=3.11 -y
```

### 2. Activate environment

```bash
conda activate vis
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Or using conda run (without activating):

```bash
conda run -n vis pip install -r requirements.txt
```

## Running the Application

### Activate and run

```bash
conda activate vis
python app.py
```

Or using conda run:

```bash
conda run -n vis python app.py
```

The server will start at `http://localhost:8000`

## Dependencies

| Package | Version |
|---------|---------|
| fastapi | 0.115.0 |
| uvicorn | 0.30.0 |
| pandas | 2.2.0 |
| scikit-learn | 1.5.0 |
| numpy | 1.26.0 |
| scipy | 1.14.0 |
| manim | 0.18.0 |

## Troubleshooting

### Verify environment setup

```bash
conda run -n vis python -c "import app; print('OK')"
```

### Check installed packages

```bash
conda run -n vis pip list
```