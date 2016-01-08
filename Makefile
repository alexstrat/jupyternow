docker_build:
	docker build -t alexstrat/jupyternow .

docker_push: docker_build
	docker tag -f alexstrat/jupyternow tutum.co/alexstrat/jupyternow
	docker push tutum.co/alexstrat/jupyternow

clean_containers:
	docker stop `docker ps -a -q`
	docker rm `docker ps -a -q`
