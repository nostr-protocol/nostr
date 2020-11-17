relay-lite: $(shell find . -name "*.go")
	go build -ldflags="-s -w" -o ./relay-lite

relay-full: $(shell find . -name "*.go")
	go build -ldflags="-s -w" -tags full -o ./relay-full
