FROM geodata/gdal:1.11.5
MAINTAINER Marc Harter <wavded@gmail.com
ENV TMPDIR /tmp

USER root

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -
RUN apt-get install -y nodejs
