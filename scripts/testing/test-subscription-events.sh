#!/bin/bash

# Test subscription events script
# This script helps test various subscription lifecycle events using the Stripe CLI

echo "🧪 Learning Crypto Subscription Testing Script"
echo "=============================================="

# Make script executable with: chmod +x scripts/test-subscription-events.sh
# Run with: ./scripts/test-subscription-events.sh

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed. Please install it first."
    echo "   Visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Print test options
print_options() {
    echo -e "\n${BLUE}Available Tests:${NC}"
    echo -e "${YELLOW}1${NC}. Test Checkout Session Completed"
    echo -e "${YELLOW}2${NC}. Test Subscription Renewal (Invoice Payment Succeeded)"
    echo -e "${YELLOW}3${NC}. Test Subscription Updated (e.g., Plan Change)"
    echo -e "${YELLOW}4${NC}. Test Subscription Canceled Immediately"
    echo -e "${YELLOW}5${NC}. Test Payment Failed"
    echo -e "${YELLOW}6${NC}. Test Cancel At Period End (Stripe Dashboard Cancellation)"
    echo -e "${YELLOW}7${NC}. Test Sync Subscription Status"
    echo -e "${YELLOW}q${NC}. Quit"
    echo -e "\nEnter your choice: "
}

# Get test customer and subscription IDs
read -p "Enter a Stripe customer ID (e.g. cus_XXX) or press Enter to use test ID: " CUSTOMER_ID
CUSTOMER_ID=${CUSTOMER_ID:-"cus_test123456789"}

read -p "Enter a Stripe subscription ID (e.g. sub_XXX) or press Enter to use test ID: " SUBSCRIPTION_ID
SUBSCRIPTION_ID=${SUBSCRIPTION_ID:-"sub_test123456789"}

read -p "Enter a Stripe price ID (e.g. price_XXX) or press Enter to use test ID: " PRICE_ID
PRICE_ID=${PRICE_ID:-"price_test123456789"}

# Main testing loop
while true; do
    print_options
    read -r choice
    
    case $choice in
        1)
            echo -e "\n${GREEN}Testing Checkout Session Completed Event${NC}"
            echo "This simulates a new subscription being created"
            
            stripe trigger checkout.session.completed \
              --subscription=$SUBSCRIPTION_ID \
              --customer=$CUSTOMER_ID \
              --add metadata.planId=monthly \
              --add metadata.userId=auto-generated-id
              
            echo -e "${YELLOW}Check your application logs and database!${NC}"
            ;;
            
        2)
            echo -e "\n${GREEN}Testing Subscription Renewal Event${NC}"
            echo "This simulates a successful renewal payment"
            
            stripe trigger invoice.payment_succeeded \
              --subscription=$SUBSCRIPTION_ID \
              --customer=$CUSTOMER_ID
              
            echo -e "${YELLOW}Subscription should be updated with a new billing period!${NC}"
            ;;
            
        3)
            echo -e "\n${GREEN}Testing Subscription Updated Event${NC}"
            echo "This simulates a subscription plan change"
            
            stripe trigger customer.subscription.updated \
              --id=$SUBSCRIPTION_ID \
              --customer=$CUSTOMER_ID \
              --items[0][price]=$PRICE_ID
              
            echo -e "${YELLOW}Check that subscription was updated in database!${NC}"
            ;;
            
        4)
            echo -e "\n${GREEN}Testing Subscription Cancellation Event${NC}"
            echo "This simulates a subscription being canceled"
            
            stripe trigger customer.subscription.deleted \
              --id=$SUBSCRIPTION_ID
              
            echo -e "${YELLOW}Subscription should be marked as canceled in database!${NC}"
            ;;
            
        5)
            echo -e "\n${GREEN}Testing Payment Failed Event${NC}"
            echo "This simulates a failed renewal payment"
            
            stripe trigger invoice.payment_failed \
              --customer=$CUSTOMER_ID \
              --subscription=$SUBSCRIPTION_ID
              
            echo -e "${YELLOW}Check how your system handles failed payments!${NC}"
            ;;
            
        6)
            echo -e "\n${GREEN}Testing Cancel At Period End (Stripe Dashboard Cancellation)${NC}"
            echo "This simulates a user canceling their subscription from the Stripe dashboard"
            
            stripe trigger customer.subscription.updated \
              --id=$SUBSCRIPTION_ID \
              --cancel-at-period-end=true
              
            echo -e "${YELLOW}Subscription should be marked as 'canceling at period end' in database!${NC}"
            ;;
            
        7)
            echo -e "\n${GREEN}Testing Sync Subscription Status${NC}"
            echo "This manually tests the sync subscription status endpoint"
            
            # Get the application URL
            read -p "Enter your application URL (e.g., http://localhost:3000): " APP_URL
            APP_URL=${APP_URL:-"http://localhost:3000"}
            
            read -p "Enter a user ID: " USER_ID
            USER_ID=${USER_ID:-"user_test"}
            
            curl -X POST "${APP_URL}/api/stripe/sync-subscription" \
              -H "Content-Type: application/json" \
              -d "{\"subscriptionId\":\"${SUBSCRIPTION_ID}\",\"userId\":\"${USER_ID}\"}"
              
            echo -e "\n${YELLOW}Check application logs for sync result!${NC}"
            ;;
            
        q|Q)
            echo -e "\n${GREEN}Exiting Test Script${NC}"
            exit 0
            ;;
            
        *)
            echo -e "\n${YELLOW}Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo -e "\nPress Enter to continue..."
    read
done 