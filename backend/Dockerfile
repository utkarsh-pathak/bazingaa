# backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application's code into the container
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000



# Run uvicorn when the container launches
# Use 0.0.0.0 to allow traffic from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

