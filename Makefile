.PHONY: help install test build check dev preview data

help:
	@echo "Available targets:"
	@echo "  make install   # install dependencies (pnpm, web/)"
	@echo "  make test      # run test suite"
	@echo "  make check     # run astro check"
	@echo "  make build     # build site"
	@echo "  make dev       # start dev server (web/)"
	@echo "  make preview   # serve production build"
	@echo "  make data      # generate data only"

install:
	cd web && pnpm install

test:
	cd web && pnpm test

check:
	cd web && pnpm check

build:
	cd web && pnpm build

dev:
	cd web && pnpm dev

preview:
	cd web && pnpm preview

data:
	cd web && pnpm build:data
