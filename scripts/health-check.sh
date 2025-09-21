#!/bin/bash
# AnythingLLM Health Check Script
# Validates all services and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_PORT=3002
FRONTEND_PORT=3001
COLLECTOR_PORT=8888
API_TIMEOUT=10

# Global status tracking
OVERALL_STATUS=0
ISSUES_FOUND=()

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ISSUES_FOUND+=("WARNING: $1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ISSUES_FOUND+=("ERROR: $1")
    OVERALL_STATUS=1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
port_in_use() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Check if URL is responding
url_responding() {
    local url=$1
    local timeout=${2:-5}
    curl -s -m $timeout "$url" >/dev/null 2>&1
}

# Test API endpoint
test_api_endpoint() {
    local url=$1
    local expected_pattern=${2:-""}
    local timeout=${3:-5}

    local response=$(curl -s -m $timeout "$url" 2>/dev/null || echo "")

    if [ -z "$response" ]; then
        return 1
    fi

    if [ -n "$expected_pattern" ]; then
        echo "$response" | grep -q "$expected_pattern"
        return $?
    fi

    return 0
}

# Check system dependencies
check_dependencies() {
    log_info "Checking system dependencies..."

    local deps=("node" "yarn" "curl" "lsof")
    local missing=()

    for dep in "${deps[@]}"; do
        if command_exists "$dep"; then
            log_success "$dep is installed"
        else
            missing+=("$dep")
            log_error "$dep is not installed"
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing[*]}"
        log_info "Install missing dependencies before proceeding"
        return 1
    fi

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_major=18
    local current_major=$(echo $node_version | cut -d. -f1)

    if [ "$current_major" -ge "$required_major" ]; then
        log_success "Node.js version $node_version (required: >= $required_major)"
    else
        log_error "Node.js version $node_version is too old (required: >= $required_major)"
    fi
}

# Check project structure
check_project_structure() {
    log_info "Checking project structure..."

    local required_dirs=("server" "frontend" "collector" "scripts")
    local required_files=("package.json" "server/package.json" "frontend/package.json" "collector/package.json")

    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "Directory $dir exists"
        else
            log_error "Directory $dir is missing"
        fi
    done

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "File $file exists"
        else
            log_error "File $file is missing"
        fi
    done
}

# Check environment configuration
check_environment_config() {
    log_info "Checking environment configuration..."

    local env_files=(
        "server/.env.development"
        "frontend/.env"
        "collector/.env"
    )

    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            log_success "Environment file $env_file exists"

            # Check if it's not empty
            if [ -s "$env_file" ]; then
                log_success "Environment file $env_file is not empty"
            else
                log_warning "Environment file $env_file is empty"
            fi
        else
            log_error "Environment file $env_file is missing"
        fi
    done

    # Check API key configuration
    if [ -f "server/.env.development" ]; then
        if grep -q "sk-your-openai-api-key-here" server/.env.development; then
            log_warning "OpenAI API key not configured (still using placeholder)"
            log_info "Edit server/.env.development to set your API key"
        else
            if grep -q "OPEN_AI_KEY=sk-" server/.env.development; then
                log_success "OpenAI API key appears to be configured"
            else
                log_warning "OpenAI API key format may be incorrect"
            fi
        fi

        # Check server port configuration
        if grep -q "SERVER_PORT=$SERVER_PORT" server/.env.development; then
            log_success "Server port configured correctly ($SERVER_PORT)"
        else
            log_warning "Server port configuration may be incorrect"
        fi
    fi

    # Check frontend API configuration
    if [ -f "frontend/.env" ]; then
        if grep -q "VITE_API_BASE.*:$SERVER_PORT/api" frontend/.env; then
            log_success "Frontend API configuration matches server port"
        else
            log_warning "Frontend API configuration may not match server port"
            log_info "Frontend should point to http://localhost:$SERVER_PORT/api"
        fi
    fi
}

# Check database
check_database() {
    log_info "Checking database..."

    if [ -f "server/storage/anythingllm.db" ]; then
        log_success "SQLite database file exists"

        # Check if database is not empty (basic check)
        local db_size=$(stat -f%z "server/storage/anythingllm.db" 2>/dev/null || stat -c%s "server/storage/anythingllm.db" 2>/dev/null || echo "0")
        if [ "$db_size" -gt 1000 ]; then
            log_success "Database appears to be initialized (size: ${db_size} bytes)"
        else
            log_warning "Database file is very small, may need initialization"
        fi
    else
        log_warning "Database file does not exist (will be created on first run)"
    fi

    # Check if Prisma client is generated
    if [ -d "server/node_modules/@prisma/client" ]; then
        log_success "Prisma client is generated"
    else
        log_warning "Prisma client not generated, run 'yarn prisma:generate'"
    fi
}

# Check node modules
check_node_modules() {
    log_info "Checking node modules..."

    local modules=("server/node_modules" "frontend/node_modules" "collector/node_modules")

    for module_dir in "${modules[@]}"; do
        if [ -d "$module_dir" ]; then
            local count=$(find "$module_dir" -maxdepth 1 -type d | wc -l)
            if [ "$count" -gt 10 ]; then
                log_success "$(dirname $module_dir) dependencies installed ($count packages)"
            else
                log_warning "$(dirname $module_dir) dependencies may be incomplete"
            fi
        else
            log_error "$(dirname $module_dir) dependencies not installed"
        fi
    done
}

# Check running services
check_running_services() {
    log_info "Checking running services..."

    # Check if services are running on expected ports
    if port_in_use $SERVER_PORT; then
        log_success "Server is running on port $SERVER_PORT"

        # Test API endpoint
        if test_api_endpoint "http://localhost:$SERVER_PORT/api/ping" '"online":true' $API_TIMEOUT; then
            log_success "Server API is responding correctly"
        else
            log_warning "Server is running but API is not responding correctly"
        fi
    else
        log_warning "Server is not running on port $SERVER_PORT"
    fi

    if port_in_use $FRONTEND_PORT; then
        log_success "Frontend is running on port $FRONTEND_PORT"

        # Test frontend
        if url_responding "http://localhost:$FRONTEND_PORT" $API_TIMEOUT; then
            log_success "Frontend is responding"
        else
            log_warning "Frontend is running but not responding"
        fi
    else
        log_warning "Frontend is not running on port $FRONTEND_PORT"
    fi

    if port_in_use $COLLECTOR_PORT; then
        log_success "Collector is running on port $COLLECTOR_PORT"

        # Test collector
        if test_api_endpoint "http://localhost:$COLLECTOR_PORT/ping" "OK" $API_TIMEOUT; then
            log_success "Collector API is responding"
        else
            log_warning "Collector is running but not responding correctly"
        fi
    else
        log_warning "Collector is not running on port $COLLECTOR_PORT"
    fi
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."

    # Check available disk space
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -gt 1000000 ]; then  # 1GB in KB
        log_success "Sufficient disk space available"
    else
        log_warning "Low disk space available"
    fi

    # Check if ports are available (when services are not running)
    local ports=($SERVER_PORT $FRONTEND_PORT $COLLECTOR_PORT)
    for port in "${ports[@]}"; do
        if ! port_in_use $port; then
            log_success "Port $port is available"
        fi
    done
}

# Show summary
show_summary() {
    echo ""
    echo "$(echo -e ${BLUE})━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(echo -e ${NC})"
    echo -e "${BLUE}📋 Health Check Summary${NC}"
    echo "$(echo -e ${BLUE})━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(echo -e ${NC})"

    if [ $OVERALL_STATUS -eq 0 ] && [ ${#ISSUES_FOUND[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! System is healthy.${NC}"
    elif [ $OVERALL_STATUS -eq 0 ]; then
        echo -e "${YELLOW}⚠️  System is functional but has warnings:${NC}"
        for issue in "${ISSUES_FOUND[@]}"; do
            echo -e "${YELLOW}   • $issue${NC}"
        done
    else
        echo -e "${RED}❌ System has critical issues:${NC}"
        for issue in "${ISSUES_FOUND[@]}"; do
            if [[ $issue == ERROR:* ]]; then
                echo -e "${RED}   • $issue${NC}"
            else
                echo -e "${YELLOW}   • $issue${NC}"
            fi
        done
        echo ""
        echo -e "${RED}🚨 Please resolve critical issues before proceeding.${NC}"
    fi

    echo ""
    echo -e "${BLUE}💡 Next Steps:${NC}"
    if [ $OVERALL_STATUS -eq 0 ]; then
        echo -e "${GREEN}   • System is ready for development${NC}"
        echo -e "${GREEN}   • Run 'make dev' to start development services${NC}"
        echo -e "${GREEN}   • Access frontend at http://localhost:$FRONTEND_PORT${NC}"
    else
        echo -e "${RED}   • Run 'make install' to fix installation issues${NC}"
        echo -e "${RED}   • Check the errors above and resolve them${NC}"
    fi
}

# Main execution logic
main() {
    local mode=${1:-"standard"}

    case $mode in
        "--quick")
            echo -e "${BLUE}🏃 Quick Health Check${NC}"
            echo ""
            check_dependencies
            check_environment_config
            ;;
        "--post-start")
            echo -e "${BLUE}🚀 Post-Start Health Check${NC}"
            echo ""
            sleep 2  # Give services time to start
            check_running_services
            ;;
        "--detailed"|"--comprehensive")
            echo -e "${BLUE}🔍 Comprehensive Health Check${NC}"
            echo ""
            check_dependencies
            check_project_structure
            check_environment_config
            check_database
            check_node_modules
            check_running_services
            check_system_resources
            ;;
        *)
            echo -e "${BLUE}🏥 Standard Health Check${NC}"
            echo ""
            check_dependencies
            check_environment_config
            check_database
            check_running_services
            ;;
    esac

    show_summary
    return $OVERALL_STATUS
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi