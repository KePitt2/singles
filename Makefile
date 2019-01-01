SHELL:=/bin/bash
.ONESHELL:
.SHELLFLAGS: -e -O extglob

BIN       = bin
APP      ?= .
APP_BIN   = ${APP}/bin
APP_BUILD = ${APP}/build

### Docker conf
DOCKER_COMPOSE_VERSION  = 1.17.0
DOCKER_COMPOSE_BIN      = ${BIN}/docker-compose

DOCKER_COMPOSE_FILE    ?= docker-compose.yaml
DOCKER_COMPOSE          = $(DOCKER_COMPOSE_BIN) -f ${DOCKER_COMPOSE_FILE}

DOCKER_BUILD_PARAMS    ?=
DOCKER_RUN             ?= $(DOCKER_COMPOSE) run --rm
DOCKER_FILES           ?= ${APP}/docker-files

### PHP conf
PHP_CLI          ?= $(DOCKER_RUN) php php
SASS_CLI         ?= $(DOCKER_RUN) sass

COMPOSER_VERSION  = 1.6.4
COMPOSER_BIN      = ${BIN}/composer
COMPOSER          = $(PHP_CLI) ${APP_BIN}/composer
COMPOSER_OPTIONS ?= --no-suggest --ignore-platform-reqs --optimize-autoloader

ENV_FILE          = dot.env
TAG_NAME          = VERSION
BRANCH_MASTER     = master

CHAG_VERSION      = master
CHAG              = ${BIN}/chag

help:                                   ## Show this help
	$I available rules...
	echo
	grep -E '^(\$$|[ a-zA-Z_-]+):.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	echo

### Release
tag: TAG ?= $(filter v%, $(subst refs/heads/release/,,$(shell git symbolic-ref -q HEAD 2> /dev/null)))
tag: | ${CHAG}                          ## Create new version tag
	$I Tagging ${TAG}...
	$(if ${TAG},,$(error TAG is not defined. Pass via "make tag TAG=v4.2.1"))
	git checkout -b release/${TAG} || git checkout release/${TAG}
	$(CHAG) update ${TAG}
	sed -e "s/${TAG_NAME}=.*/${TAG_NAME}=${TAG}/" "${ENV_FILE}" > \
			${ENV_FILE}.tmp && mv ${ENV_FILE}.tmp ${ENV_FILE}
	git add ${ENV_FILE} CHANGELOG.md
	git commit -m '${TAG} release'
	git fetch
	git checkout -B ${BRANCH_MASTER} origin/${BRANCH_MASTER}
	git merge --no-ff -m "merge release/${TAG} to ${BRANCH_MASTER}" release/${TAG}
	$(CHAG) tag

### Running

build: ${DOCKER_FILES} ${DOCKER_COMPOSE_BIN}     ## Build sass compiler
	$I Building...
	$(DOCKER_COMPOSE) build sass

down: | ${DOCKER_COMPOSE_BIN}			         ## Stop and remove all services executed
	$I stop and remove all...
	$(DOCKER_COMPOSE) down

start: | ${DOCKER_FILES} ${DOCKER_COMPOSE_BIN}   ## Start services to run application
	$I start server...
	$(DOCKER_COMPOSE) up -d

stop: | ${DOCKER_COMPOSE_BIN}			         ## Stop current execution
	$I stop server...
	-$(DOCKER_COMPOSE) stop

logs: | ${DOCKER_COMPOSE_BIN}			         ## Show logs genererated
	-$(DOCKER_COMPOSE) logs -f

### Dependencies

sass: | ${DOCKER_COMPOSE_BIN}                    ## Compile sass files
	$(SASS_CLI) build

sass-watch: | ${DOCKER_COMPOSE_BIN}              ## Runnig compiler in watcher mode
	$(SASS_CLI) watch

vendor: composer.json  | ${COMPOSER_BIN}         ## Deploy dependencies
	$I generate dependencies...
	$(COMPOSER) install ${COMPOSER_OPTIONS} || exit 1

vendor-update: | ${COMPOSER_BIN}                 ## Force update dependencies
	$I updating all dependencies...
	$(COMPOSER) update ${COMPOSER_OPTIONS} || exit 1

### Tools

${BIN}:
	@mkdir -p $@

${CHAG}: | ${BIN}
	$I installing chag...
	curl -sSL "https://raw.githubusercontent.com/mtdowling/chag/${CHAG_VERSION}/chag" \
		-o "${CHAG}"
	chmod +x ${CHAG}

${COMPOSER_BIN}: | ${BIN}
	$I installing composer...
	curl -sSL https://getcomposer.org/installer -o ${BIN}/composer-installer
	$(PHP_CLI) -f ${APP_BIN}/composer-installer -- \
			--install-dir=${APP_BIN}  \
	        --filename=composer  \
	        --version=${COMPOSER_VERSION} || exit $?
	rm -rf ${BIN}/composer-installer

${DOCKER_COMPOSE_BIN}: | ${BIN}
	$I installing docker-compose...
	curl -sSL \
		https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` \
		-o "${DOCKER_COMPOSE_BIN}"
	chmod +x ${DOCKER_COMPOSE_BIN}

${DOCKER_FILES}: | ${BIN}
	$I installing docker-files...
	unzip docker-files.zip
	chmod +x docker-files

### Xtras

.env: ${ENV_FILE}
	sed -e "s/${TAG_NAME}=.*/${TAG_NAME}=latest/" "${ENV_FILE}" > .env

var:
	$I var structure and permissions...
	chmod 6777 var/cache

clean:                           ## Cleanup building artifacts
	$I cleaning...
	sudo rm -rf build var/cache/*/* var/tmp/*
	$(SASS_CLI) clean

uninstall: clean                 ## Reset project installation
	$I undo installation...
	rm -rf ${BIN}/ .env
	sudo rm -rf vendor var/*/* node_modules

install: .env var build vendor   ## Install and prepare all dependences
	$(DOCKER_COMPOSE) pull server php

####
# Verbose (1, 0)
V = 0
# If verbose don't put @
Q = $(if $(filter 1,$V),,@)
# Prompt for messages
M = $(shell printf "\033[34;1m▶\033[0m")
# Info
I = $Q echo -e "\n${M}"

.PHONY: build start down clean update vendor-update help uninstall install tag sass sass-watch var
