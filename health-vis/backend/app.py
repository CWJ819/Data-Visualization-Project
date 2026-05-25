"""HealthVis Backend — FastAPI server"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import data, analysis

app = FastAPI(title="HealthVis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api", tags=["Data"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])

@app.get("/")
def root():
    return {"message": "HealthVis API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
