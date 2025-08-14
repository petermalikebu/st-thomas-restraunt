# Deployment Guide - St. Thomas Square Restaurant Management System

This guide provides step-by-step instructions for deploying the restaurant management system in various environments.

## Local Development Deployment

### Quick Start
1. Extract the zip file
2. Navigate to the project directory
3. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the application:
   ```bash
   python src/main.py
   ```
6. Access the application at `http://localhost:5002`

## Production Deployment

### Option 1: Traditional Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Python 3.8+
- Nginx (recommended)
- SSL certificate (recommended)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv nginx -y

# Create application user
sudo useradd -m -s /bin/bash restaurant
sudo usermod -aG sudo restaurant
```

#### Step 2: Application Setup
```bash
# Switch to application user
sudo su - restaurant

# Upload and extract application
cd /home/restaurant
# Upload st_thomas_restaurant.zip here
unzip st_thomas_restaurant.zip
cd st_thomas_restaurant

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn
```

#### Step 3: Environment Configuration
```bash
# Copy and configure environment file
cp .env.example .env
nano .env

# Update the following values:
SECRET_KEY=your-production-secret-key-here
FLASK_ENV=production
DATABASE_URL=sqlite:///database/app.db  # Or PostgreSQL/MySQL URL
HOST=127.0.0.1
PORT=5002
```

#### Step 4: Database Setup
```bash
# Create database directory
mkdir -p src/database
chmod 755 src/database

# Initialize database (will be created on first run)
python src/main.py &
sleep 5
pkill -f "python src/main.py"
```

#### Step 5: Systemd Service
```bash
# Create systemd service file
sudo nano /etc/systemd/system/restaurant.service
```

Add the following content:
```ini
[Unit]
Description=St. Thomas Square Restaurant Management System
After=network.target

[Service]
User=restaurant
Group=restaurant
WorkingDirectory=/home/restaurant/st_thomas_restaurant
Environment=PATH=/home/restaurant/st_thomas_restaurant/venv/bin
ExecStart=/home/restaurant/st_thomas_restaurant/venv/bin/gunicorn -w 4 -b 127.0.0.1:5002 src.main:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable restaurant
sudo systemctl start restaurant
sudo systemctl status restaurant
```

#### Step 6: Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/restaurant
```

Add the following content:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/restaurant/st_thomas_restaurant/src/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/restaurant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: SSL Certificate (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application code
COPY . .

# Create database directory
RUN mkdir -p src/database

# Expose port
EXPOSE 5002

# Run application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5002", "src.main:app"]
```

#### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  restaurant:
    build: .
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=your-production-secret-key
    volumes:
      - ./src/database:/app/src/database
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - restaurant
    restart: unless-stopped
```

#### Step 3: Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment
1. Create `Procfile`:
   ```
   web: gunicorn -w 4 -b 0.0.0.0:$PORT src.main:app
   ```

2. Create `runtime.txt`:
   ```
   python-3.9.18
   ```

3. Deploy:
   ```bash
   heroku create your-restaurant-app
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set FLASK_ENV=production
   git push heroku main
   ```

#### AWS EC2 Deployment
Follow the traditional server deployment steps on an EC2 instance.

#### DigitalOcean App Platform
1. Connect your repository
2. Set environment variables
3. Deploy automatically

## Database Migration (Production)

### SQLite to PostgreSQL
```bash
# Install PostgreSQL adapter
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost/restaurant_db

# Create PostgreSQL database
sudo -u postgres createdb restaurant_db
sudo -u postgres createuser restaurant_user
sudo -u postgres psql -c "ALTER USER restaurant_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_user;"
```

## Monitoring and Maintenance

### Log Management
```bash
# View application logs
sudo journalctl -u restaurant -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /home/restaurant/st_thomas_restaurant/src/database/app.db \
   /home/restaurant/backups/app_db_$DATE.db

# Add to crontab for daily backups
0 2 * * * /home/restaurant/backup_db.sh
```

### Performance Optimization
1. **Enable Gzip compression** in Nginx
2. **Use CDN** for static files
3. **Implement caching** for menu items
4. **Database indexing** for frequently queried fields
5. **Monitor resource usage** with tools like htop, iotop

### Security Checklist
- [ ] Change default SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Regular security updates
- [ ] Firewall configuration
- [ ] Database access restrictions
- [ ] Regular backups
- [ ] Monitor access logs

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   ```bash
   sudo chown -R restaurant:restaurant /home/restaurant/st_thomas_restaurant
   chmod -R 755 /home/restaurant/st_thomas_restaurant
   ```

2. **Database Connection Issues**
   ```bash
   # Check database file permissions
   ls -la src/database/
   # Recreate database if corrupted
   rm src/database/app.db
   python src/main.py
   ```

3. **Service Won't Start**
   ```bash
   # Check service status
   sudo systemctl status restaurant
   # View detailed logs
   sudo journalctl -u restaurant -n 50
   ```

4. **Nginx Configuration Issues**
   ```bash
   # Test configuration
   sudo nginx -t
   # Reload configuration
   sudo systemctl reload nginx
   ```

### Performance Issues
- Monitor CPU and memory usage
- Check database query performance
- Optimize static file serving
- Consider load balancing for high traffic

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple application instances
- Shared database
- Session storage (Redis)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching
- Use faster storage (SSD)

## Support

For deployment assistance:
- Email: admin@stthomassquare.com
- Documentation: Check README.md
- Logs: Always check application and system logs first

---

This deployment guide covers most common scenarios. Adjust configurations based on your specific requirements and infrastructure.

