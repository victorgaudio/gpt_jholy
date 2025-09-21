#!/bin/bash
# AnythingLLM Port Validator Script
# Detects and resolves port conflicts automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default ports configuration
DEFAULT_SERVER_PORT=3002
DEFAULT_FRONTEND_PORT=3001
DEFAULT_COLLECTOR_PORT=8888

# Alternative ports if defaults are in use
ALT_SERVER_PORTS=(3003 3004 3005 3006)
ALT_FRONTEND_PORTS=(3000 3010 3011 3012)
ALT_COLLECTOR_PORTS=(8889 8890 8891 8892)

# Configuration tracking
CURRENT_SERVER_PORT=""
CURRENT_FRONTEND_PORT=""
CURRENT_COLLECTOR_PORT=""
CHANGES_MADE=0

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if port is in use
port_in_use() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Find next available port from array
find_available_port() {
    local default_port=$1
    shift
    local alt_ports=("$@")

    # Check if default port is available
    if ! port_in_use $default_port; then
        echo $default_port
        return
    fi

    # Check alternative ports
    for port in "${alt_ports[@]}"; do
        if ! port_in_use $port; then
            echo $port
            return
        fi
    done

    # If no predefined port is available, find any available port
    for port in $(seq 3001 3100); do
        if ! port_in_use $port; then
            echo $port
            return
        fi
    done

    echo ""
}

# Get current port configuration
get_current_config() {
    # Get server port
    if [ -f "server/.env.development" ]; then
        CURRENT_SERVER_PORT=$(grep "^SERVER_PORT=" server/.env.development 2>/dev/null | cut -d= -f2 || echo "")
    fi
    if [ -z "$CURRENT_SERVER_PORT" ]; then
        CURRENT_SERVER_PORT=$DEFAULT_SERVER_PORT
    fi

    # Get frontend port (check what API base URL it's configured for)
    if [ -f "frontend/.env" ]; then
        local api_base=$(grep "^VITE_API_BASE=" frontend/.env 2>/dev/null | cut -d= -f2 | tr -d "'" | tr -d '"')
        if [[ $api_base =~ localhost:([0-9]+)/api ]]; then
            CURRENT_SERVER_PORT=${BASH_REMATCH[1]}
        fi
    fi

    # Collector port is usually fixed, but check environment
    if [ -f "collector/.env" ]; then
        CURRENT_COLLECTOR_PORT=$(grep "^COLLECTOR_PORT=" collector/.env 2>/dev/null | cut -d= -f2 || echo "")
    fi
    if [ -z "$CURRENT_COLLECTOR_PORT" ]; then
        CURRENT_COLLECTOR_PORT=$DEFAULT_COLLECTOR_PORT
    fi

    # Frontend port is typically the server port - 1 for development
    CURRENT_FRONTEND_PORT=$((CURRENT_SERVER_PORT - 1))
}

# Update server configuration
update_server_config() {
    local new_port=$1
    log_info "Updating server configuration to port $new_port"

    if [ -f "server/.env.development" ]; then
        if grep -q "^SERVER_PORT=" server/.env.development; then
            sed -i.bak "s/^SERVER_PORT=.*/SERVER_PORT=$new_port/" server/.env.development
        else
            echo "SERVER_PORT=$new_port" >> server/.env.development
        fi
        rm -f server/.env.development.bak
        log_success "Server configuration updated"
        CHANGES_MADE=1
    else
        log_error "Server environment file not found"
        return 1
    fi
}

# Update frontend configuration
update_frontend_config() {
    local server_port=$1
    log_info "Updating frontend configuration to use server port $server_port"

    if [ -f "frontend/.env" ]; then
        local api_base="http://localhost:$server_port/api"
        if grep -q "^VITE_API_BASE=" frontend/.env; then
            sed -i.bak "s|^VITE_API_BASE=.*|VITE_API_BASE='$api_base' # Use this URL when developing locally|" frontend/.env
        else
            echo "VITE_API_BASE='$api_base' # Use this URL when developing locally" >> frontend/.env
        fi
        rm -f frontend/.env.bak
        log_success "Frontend configuration updated"
        CHANGES_MADE=1
    else
        log_error "Frontend environment file not found"
        return 1
    fi
}

# Update collector configuration
update_collector_config() {
    local new_port=$1
    log_info "Updating collector configuration to port $new_port"

    if [ -f "collector/.env" ]; then
        if grep -q "^COLLECTOR_PORT=" collector/.env; then
            sed -i.bak "s/^COLLECTOR_PORT=.*/COLLECTOR_PORT=$new_port/" collector/.env
        else
            echo "COLLECTOR_PORT=$new_port" >> collector/.env
        fi
        rm -f collector/.env.bak
        log_success "Collector configuration updated"
        CHANGES_MADE=1
    else
        log_warning "Collector environment file not found, using default port $DEFAULT_COLLECTOR_PORT"
    fi
}

# Check and fix port conflicts
check_port_conflicts() {
    log_info "Checking for port conflicts..."

    get_current_config

    local conflicts=()
    local new_server_port=$CURRENT_SERVER_PORT
    local new_frontend_port=$CURRENT_FRONTEND_PORT
    local new_collector_port=$CURRENT_COLLECTOR_PORT

    # Check server port
    if port_in_use $CURRENT_SERVER_PORT; then
        log_warning "Server port $CURRENT_SERVER_PORT is in use"
        new_server_port=$(find_available_port $DEFAULT_SERVER_PORT "${ALT_SERVER_PORTS[@]}")
        if [ -n "$new_server_port" ]; then
            log_info "Found alternative server port: $new_server_port"
            conflicts+=("server")
        else
            log_error "No alternative server port available"
            return 1
        fi
    fi

    # Check frontend port
    new_frontend_port=$((new_server_port - 1))
    if port_in_use $new_frontend_port; then
        log_warning "Frontend port $new_frontend_port is in use"
        new_frontend_port=$(find_available_port $new_frontend_port "${ALT_FRONTEND_PORTS[@]}")
        if [ -n "$new_frontend_port" ]; then
            log_info "Found alternative frontend port: $new_frontend_port"
        else
            log_error "No alternative frontend port available"
            return 1
        fi
    fi

    # Check collector port
    if port_in_use $CURRENT_COLLECTOR_PORT; then
        log_warning "Collector port $CURRENT_COLLECTOR_PORT is in use"
        new_collector_port=$(find_available_port $DEFAULT_COLLECTOR_PORT "${ALT_COLLECTOR_PORTS[@]}")
        if [ -n "$new_collector_port" ]; then
            log_info "Found alternative collector port: $new_collector_port"
            conflicts+=("collector")
        else
            log_error "No alternative collector port available"
            return 1
        fi
    fi

    # Update configurations if needed
    if [ ${#conflicts[@]} -gt 0 ]; then
        log_info "Resolving port conflicts..."

        # Update server config if port changed
        if [ "$new_server_port" != "$CURRENT_SERVER_PORT" ]; then
            update_server_config $new_server_port
        fi

        # Always update frontend to match server port
        update_frontend_config $new_server_port

        # Update collector if port changed
        if [ "$new_collector_port" != "$CURRENT_COLLECTOR_PORT" ]; then
            update_collector_config $new_collector_port
        fi

        log_success "Port conflicts resolved"
        show_port_summary $new_server_port $new_frontend_port $new_collector_port
    else
        log_success "No port conflicts detected"
        show_port_summary $CURRENT_SERVER_PORT $CURRENT_FRONTEND_PORT $CURRENT_COLLECTOR_PORT
    fi
}

# Validate port configuration consistency
validate_port_consistency() {
    log_info "Validating port configuration consistency..."

    get_current_config

    local errors=0

    # Check if frontend API base matches server port
    if [ -f "frontend/.env" ]; then
        local api_base=$(grep "^VITE_API_BASE=" frontend/.env 2>/dev/null | cut -d= -f2 | tr -d "'" | tr -d '"')
        if [[ $api_base =~ localhost:([0-9]+)/api ]]; then
            local frontend_api_port=${BASH_REMATCH[1]}
            if [ "$frontend_api_port" != "$CURRENT_SERVER_PORT" ]; then
                log_warning "Frontend API configuration ($frontend_api_port) doesn't match server port ($CURRENT_SERVER_PORT)"
                update_frontend_config $CURRENT_SERVER_PORT
                errors=1
            fi
        else
            log_warning "Frontend API base URL format is invalid: $api_base"
            update_frontend_config $CURRENT_SERVER_PORT
            errors=1
        fi
    fi

    if [ $errors -eq 0 ]; then
        log_success "Port configuration is consistent"
    else
        log_success "Port configuration inconsistencies fixed"
    fi
}

# Show port configuration summary
show_port_summary() {
    local server_port=$1
    local frontend_port=$2
    local collector_port=$3

    echo ""
    echo -e "${BLUE}📋 Port Configuration Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🌐 Frontend:${NC}  http://localhost:$frontend_port"
    echo -e "${GREEN}🔧 Server:${NC}    http://localhost:$server_port"
    echo -e "${GREEN}📄 API:${NC}       http://localhost:$server_port/api"
    echo -e "${GREEN}📊 Collector:${NC} http://localhost:$collector_port"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $CHANGES_MADE -eq 1 ]; then
        echo -e "${YELLOW}⚠️  Configuration changes made. Restart services to apply changes.${NC}"
    fi
}

# Force reconfigure ports (for troubleshooting)
force_reconfigure() {
    log_info "Force reconfiguring ports to defaults..."

    # Stop any running services first
    log_info "Stopping any running services..."
    pkill -f "yarn dev" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    sleep 2

    # Reconfigure to defaults
    update_server_config $DEFAULT_SERVER_PORT
    update_frontend_config $DEFAULT_SERVER_PORT
    update_collector_config $DEFAULT_COLLECTOR_PORT

    log_success "Ports reconfigured to defaults"
    show_port_summary $DEFAULT_SERVER_PORT $((DEFAULT_SERVER_PORT - 1)) $DEFAULT_COLLECTOR_PORT
}

# Show current port usage
show_port_usage() {
    echo -e "${BLUE}📊 Current Port Usage${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local ports=(3000 3001 3002 3003 3004 8888 8889 8890)
    for port in "${ports[@]}"; do
        if port_in_use $port; then
            local process=$(lsof -i :$port 2>/dev/null | tail -1 | awk '{print $1, $2}' || echo "Unknown")
            echo -e "${RED}❌ Port $port: In use ($process)${NC}"
        else
            echo -e "${GREEN}✅ Port $port: Available${NC}"
        fi
    done
}

# Main execution logic
main() {
    local command=${1:-"check"}

    case $command in
        "check")
            echo -e "${BLUE}🔍 AnythingLLM Port Validator${NC}"
            echo ""
            check_port_conflicts
            validate_port_consistency
            ;;
        "status")
            show_port_usage
            echo ""
            get_current_config
            show_port_summary $CURRENT_SERVER_PORT $CURRENT_FRONTEND_PORT $CURRENT_COLLECTOR_PORT
            ;;
        "force")
            echo -e "${BLUE}🔧 Force Reconfiguring Ports${NC}"
            echo ""
            force_reconfigure
            ;;
        "help")
            echo -e "${BLUE}📋 Port Validator Help${NC}"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  check    - Check and resolve port conflicts (default)"
            echo "  status   - Show current port usage and configuration"
            echo "  force    - Force reconfigure to default ports"
            echo "  help     - Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            main "help"
            exit 1
            ;;
    esac
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi