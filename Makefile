# AnythingLLM Development Makefile
# Simplified workflow for installation and development

# Colors for output
GREEN := \033[0;32m
BLUE := \033[0;34m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

.PHONY: help install dev status stop logs clean reset health-check

## Help: Show available commands
help:
	@echo "$(BLUE)🚀 AnythingLLM Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup Commands:$(NC)"
	@echo "  make install     - Complete setup (dependencies, configs, database)"
	@echo "  make reset       - Reset database and configurations"
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@echo "  make dev         - Start all development services"
	@echo "  make stop        - Stop all services"
	@echo "  make status      - Check health of all services"
	@echo "  make logs        - Show aggregated logs"
	@echo ""
	@echo "$(GREEN)Maintenance Commands:$(NC)"
	@echo "  make clean       - Clean node_modules and temp files"
	@echo "  make health      - Run comprehensive health check"
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  1. make install  (first time only)"
	@echo "  2. make dev      (daily development)"
	@echo "  3. make status   (check if everything is OK)"

## Install: Complete project setup
install:
	@echo "$(BLUE)🔧 Installing AnythingLLM...$(NC)"
	@./scripts/port-validator.sh
	@./scripts/setup-simple.sh
	@./scripts/health-check.sh
	@echo "$(GREEN)✅ Installation complete! Run 'make dev' to start development.$(NC)"

## Dev: Start all development services
dev:
	@echo "$(BLUE)🚀 Starting development environment...$(NC)"
	@./scripts/health-check.sh --quick || (echo "$(RED)❌ Pre-flight check failed. Run 'make install' first.$(NC)" && exit 1)
	@./scripts/manage-env-simple.sh dev
	@sleep 3
	@./scripts/health-check.sh --post-start

## Status: Check health of all services
status:
	@echo "$(BLUE)📊 Checking service status...$(NC)"
	@./scripts/health-check.sh --detailed

## Stop: Stop all services
stop:
	@echo "$(YELLOW)🛑 Stopping all services...$(NC)"
	@./scripts/manage-env-simple.sh stop
	@echo "$(GREEN)✅ All services stopped$(NC)"

## Logs: Show aggregated logs
logs:
	@echo "$(BLUE)📋 Showing service logs...$(NC)"
	@echo "$(YELLOW)Note: This shows recent logs. For live logs, check individual terminal windows.$(NC)"
	@echo ""
	@echo "$(GREEN)=== Server Logs ===$(NC)"
	@if [ -f "server/logs/server.log" ]; then tail -20 server/logs/server.log; else echo "No server logs found"; fi
	@echo ""
	@echo "$(GREEN)=== Frontend Logs ===$(NC)"
	@if [ -f "frontend/logs/frontend.log" ]; then tail -20 frontend/logs/frontend.log; else echo "No frontend logs found"; fi
	@echo ""
	@echo "$(GREEN)=== Collector Logs ===$(NC)"
	@if [ -f "collector/logs/collector.log" ]; then tail -20 collector/logs/collector.log; else echo "No collector logs found"; fi

## Health: Run comprehensive health check
health:
	@echo "$(BLUE)🏥 Running comprehensive health check...$(NC)"
	@./scripts/health-check.sh --comprehensive

## Clean: Clean node_modules and temp files
clean:
	@echo "$(YELLOW)🧹 Cleaning project...$(NC)"
	@./scripts/manage-env-simple.sh clean
	@echo "$(GREEN)✅ Project cleaned. Run 'make install' to reinstall.$(NC)"

## Reset: Reset database and configurations
reset:
	@echo "$(YELLOW)🔄 Resetting project...$(NC)"
	@echo "$(RED)Warning: This will reset your database and configurations!$(NC)"
	@read -p "Are you sure? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@./scripts/manage-env-simple.sh stop
	@yarn prisma:reset
	@./scripts/setup-simple.sh --reset-configs
	@echo "$(GREEN)✅ Project reset complete. Run 'make dev' to start fresh.$(NC)"

# Utility targets (hidden from help)
check-scripts:
	@if [ ! -f "scripts/health-check.sh" ]; then echo "$(RED)❌ Missing health-check.sh script$(NC)" && exit 1; fi
	@if [ ! -f "scripts/port-validator.sh" ]; then echo "$(RED)❌ Missing port-validator.sh script$(NC)" && exit 1; fi
	@if [ ! -f "scripts/setup-simple.sh" ]; then echo "$(RED)❌ Missing setup-simple.sh script$(NC)" && exit 1; fi
	@if [ ! -f "scripts/manage-env-simple.sh" ]; then echo "$(RED)❌ Missing manage-env-simple.sh script$(NC)" && exit 1; fi

# Make all script dependencies
install dev status health: check-scripts