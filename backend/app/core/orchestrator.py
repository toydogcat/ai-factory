import docker
import os
from loguru import logger
from app.models.factory import AIInstance
from sqlalchemy.orm import Session

class DockerManager:
    def __init__(self):
        try:
            self.client = docker.from_env()
            logger.info("Docker SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Docker SDK: {e}")
            raise

    def start_instance(self, db: Session, mentor_id: str, name: str, image: str, environment: dict = {}):
        logger.info(f"Starting instance: {name} (Image: {image}) for Mentor: {mentor_id}")
        
        full_name = f"ai-factory-{name}"
        host_rule = f"{name}.localhost"
        labels = {
            "traefik.enable": "true",
            # internal localhost routing
            "traefik.http.routers." + name + ".rule": f"Host(`{host_rule}`)",
            "traefik.http.services." + name + ".loadbalancer.server.port": "8000",
            # public path-based routing (for Cloudflare)
            "traefik.http.routers." + name + "-public.rule": f"PathPrefix(`/{full_name}`)",
            "traefik.http.routers." + name + "-public.priority": "100",
            "traefik.http.routers." + name + "-public.entrypoints": "web",
            "traefik.http.routers." + name + "-public.middlewares": name + "-strip",
            "traefik.http.middlewares." + name + "-strip.stripprefix.prefixes": f"/{full_name}",
            # universal asset & api routing for subpaths (handles absolute /ui-assets, /api requests via Referer)
            # This rule intercepts any request from the room that isn't for the dashboard or main system API
            "traefik.http.routers." + name + "-assets.rule": f"HeaderRegexp(`Referer`, `.*{full_name}.*`) && !PathPrefix(`/api/v1/system`) && !Path(`/`) && !PathPrefix(`/static`) && !PathPrefix(`/favicon.ico`) ",
            "traefik.http.routers." + name + "-assets.priority": "1000",
            "traefik.http.routers." + name + "-assets.entrypoints": "web",
            "traefik.http.routers." + name + "-assets.service": name
        }
        
        # Path to i18n.json for subpath compatibility fix
        # Ensure the directory exists in the container
        i18n_path = "/home/toymsi/documents/projects/Github/ai-tarot/frontend/src/i18n.json"
        
        container = self.client.containers.run(
            image,
            name=f"ai-factory-{name}",
            detach=True,
            environment=environment,
            labels=labels,
            network="traefik-public",
            restart_policy={"Name": "always"},
            volumes={i18n_path: {'bind': '/app/frontend/dist/src/i18n.json', 'mode': 'ro'}} if os.path.exists(i18n_path) else None
        )
        
        # Save to DB
        instance = AIInstance(
            name=name,
            mentor_id=mentor_id,
            image=image,
            container_id=container.id,
            status="running",
            url=f"http://{host_rule}"
        )
        db.add(instance)
        db.commit()
        db.refresh(instance)
        
        return instance

    def list_instances(self):
        containers = self.client.containers.list(filters={"name": "ai-factory-"})
        # Exclude internal components like the database
        return [{"id": c.id, "name": c.name.replace("ai-factory-", ""), "status": c.status, "image": c.image.tags[0] if c.image.tags else "unknown"} for c in containers if c.name != "ai-factory-db"]

    def stop_instance(self, container_id: str):
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            container.remove()
            return True
        except docker.errors.NotFound:
            return False

docker_manager = DockerManager()
