.PHONY: workon unpack

workon:
	@fvtt package workon heist --type System

clear:
	@fvtt package clear

unpack:
	@make -s workon
	@echo "Unpack compendiums..."
	@fvtt unpack card-decks
	@fvtt unpack agent-types

pack:
	@make -s workon
	@echo "Pack compendiums..."
	@fvtt pack card-decks
	@fvtt pack agent-types
