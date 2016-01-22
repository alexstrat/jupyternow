FROM jupyter/datascience-notebook

USER root
COPY ./app/nbextensions /temp/nbextensions
RUN jupyter nbextension install /temp/nbextensions/jupyternow

USER jovyan
RUN jupyter nbextension enable jupyternow/main --section=common
