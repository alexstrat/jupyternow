docker_build:
	docker build -t alexstrat/jupyternow .
	@gulp jade
	docker build -t alexstrat/jupyternow-notebook -f docker-stacks/jupyternow-notebook/Dockerfile .

docker_push: docker_build
	docker tag -f alexstrat/jupyternow tutum.co/alexstrat/jupyternow
	docker push tutum.co/alexstrat/jupyternow

	docker tag -f alexstrat/jupyternow-notebook tutum.co/alexstrat/jupyternow-notebook
	docker push tutum.co/alexstrat/jupyternow-notebook

clean_containers:
	docker stop `docker ps -a -q`
	docker rm `docker ps -a -q`
