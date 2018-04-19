FROM alpine

WORKDIR /app

ENV GIN_MODE release


ADD weather /app

EXPOSE 9000 



ENTRYPOINT ["./weather", "-key", "76a0c1943f58f05fa34bed24e181ec65"]