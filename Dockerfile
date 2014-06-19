FROM homme/gdal
MAINTAINER Marc Harter <wavded@gmail.com

ENV TMPDIR /tmp
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN apt-get -y update
RUN apt-get -y install nodejs
