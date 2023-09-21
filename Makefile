.PHONY: workon clear unpack pack
PACK_DIRS := ./packs

workon:
	@fvtt package workon heist --type System

clear:
	@fvtt package clear

unpack:
	@make -s workon
	@echo "Unpack compendiums..."
	@for dir in $(shell ls ${PACK_DIRS}); do \
	    fvtt package unpack $$dir >/dev/null; \
	done
	@make -s clear

pack:
	@make -s workon
	@echo "Pack compendiums..."
	@for dir in $(shell ls ${PACK_DIRS}); do \
	    fvtt package pack $$dir >/dev/null; \
	done
	@make -s clear
