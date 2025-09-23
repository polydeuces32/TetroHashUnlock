#!/usr/bin/env python3
# TetroHashUnlock v2.0 — SAT Rewards & Coin Drop Animation
# Author: Giancarlo Vizhnay

import os
import time
import random
import threading
from typing import Optional

# Lightning Network Integration Settings
ENABLE_LIGHTNING = False  # Set to True to enable real Lightning payouts
LIGHTNING_API_URL = "https://your-lnbits-instance.com/api/v1/payments"
LIGHTNING_API_KEY = "your-api-key-here"

class CoinAnimation:
    """Handles ASCII coin drop animation"""
    
    def __init__(self):
        self.coin_frames = [
            "🪙",
            "💰", 
            "💎",
            "⭐",
            "✨"
        ]
        self.bucket = "🪣"
        
    def animate_coin_drop(self, reward: int) -> None:
        """Animate a coin dropping into a bucket"""
        print("\n" + "="*50)
        print("🎉 PUZZLE SOLVED! 🎉")
        print("="*50)
        
        # Animate coin falling
        for i in range(5):
            print(f"\n{' ' * 20}{self.coin_frames[i % len(self.coin_frames)]}")
            time.sleep(0.2)
            
        # Show bucket with coin
        print(f"\n{' ' * 18}{self.bucket}")
        print(f"{' ' * 15}└─ Coin collected!")
        
        # Display reward
        print(f"\n🎊 You earned {reward} sats! 🎊")
        print("="*50)
        
        # Play sound effect
        self.play_sound()
        
    def play_sound(self) -> None:
        """Play a sound effect (system beep)"""
        try:
            # System beep
            print("\a", end="", flush=True)
            time.sleep(0.1)
            print("\a", end="", flush=True)
        except:
            pass  # Ignore if sound not available

class Wallet:
    """Manages local SAT wallet"""
    
    def __init__(self, wallet_file: str = "wallet.txt"):
        self.wallet_file = wallet_file
        self.total_sats = self.load_wallet()
        
    def load_wallet(self) -> int:
        """Load total SATs from wallet file"""
        try:
            if os.path.exists(self.wallet_file):
                with open(self.wallet_file, 'r') as f:
                    return int(f.read().strip())
            return 0
        except:
            return 0
    
    def save_wallet(self) -> None:
        """Save total SATs to wallet file"""
        try:
            with open(self.wallet_file, 'w') as f:
                f.write(str(self.total_sats))
        except Exception as e:
            print(f"Warning: Could not save wallet: {e}")
    
    def add_sats(self, amount: int) -> None:
        """Add SATs to wallet"""
        self.total_sats += amount
        self.save_wallet()
        
    def get_balance(self) -> int:
        """Get current wallet balance"""
        return self.total_sats

class LightningPayout:
    """Handles Lightning Network payouts"""
    
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        
    def send_payment(self, amount_sats: int, invoice: str) -> dict:
        """Send Lightning payment"""
        try:
            import requests
            
            headers = {
                'X-Api-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            data = {
                'out': True,
                'bolt11': invoice,
                'amount': amount_sats
            }
            
            response = requests.post(
                f"{self.api_url}/payments",
                json=data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'response': response.json(),
                    'message': f'✅ Lightning payment of {amount_sats} sats sent!'
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}',
                    'message': f'❌ Lightning payment failed'
                }
                
        except ImportError:
            return {
                'success': False,
                'error': 'requests library not installed',
                'message': '❌ Lightning payment requires requests library'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f'❌ Lightning payment error: {e}'
            }

class RewardSystem:
    """Main reward system that handles SAT rewards and payouts"""
    
    def __init__(self):
        self.wallet = Wallet()
        self.coin_animation = CoinAnimation()
        self.lightning = None
        
        if ENABLE_LIGHTNING:
            self.lightning = LightningPayout(LIGHTNING_API_URL, LIGHTNING_API_KEY)
    
    def process_reward(self, reward_amount: int, puzzle_solved: bool = True) -> dict:
        """Process a reward - show animation and add to wallet"""
        if not puzzle_solved:
            return {
                'success': False,
                'message': 'No reward - puzzle not solved',
                'amount': 0
            }
        
        # Add to local wallet
        self.wallet.add_sats(reward_amount)
        
        # Show coin drop animation
        self.coin_animation.animate_coin_drop(reward_amount)
        
        # Display wallet balance
        balance = self.wallet.get_balance()
        print(f"\n💰 Total Wallet Balance: {balance} sats")
        
        return {
            'success': True,
            'message': f'Reward of {reward_amount} sats added to wallet',
            'amount': reward_amount,
            'total_balance': balance
        }
    
    def send_lightning_payment(self, amount_sats: int, invoice: str) -> dict:
        """Send Lightning Network payment"""
        if not ENABLE_LIGHTNING or not self.lightning:
            return {
                'success': False,
                'message': 'Lightning Network not enabled'
            }
        
        if self.wallet.get_balance() < amount_sats:
            return {
                'success': False,
                'message': f'Insufficient balance. Need {amount_sats} sats, have {self.wallet.get_balance()} sats'
            }
        
        # Send payment
        result = self.lightning.send_payment(amount_sats, invoice)
        
        if result['success']:
            # Deduct from wallet
            self.wallet.add_sats(-amount_sats)
            result['total_balance'] = self.wallet.get_balance()
        
        return result
    
    def get_wallet_balance(self) -> int:
        """Get current wallet balance"""
        return self.wallet.get_balance()
    
    def reset_wallet(self) -> None:
        """Reset wallet to zero"""
        self.wallet.total_sats = 0
        self.wallet.save_wallet()

def main():
    """Test the reward system"""
    reward_system = RewardSystem()
    
    # Test reward processing
    print("Testing reward system...")
    result = reward_system.process_reward(500, True)
    print(f"Reward result: {result}")
    
    # Test wallet balance
    balance = reward_system.get_wallet_balance()
    print(f"Current balance: {balance} sats")
    
    # Test Lightning payment (if enabled)
    if ENABLE_LIGHTNING:
        print("\nTesting Lightning payment...")
        # This would require a real invoice
        # result = reward_system.send_lightning_payment(100, "lnbc...")
        # print(f"Lightning result: {result}")

if __name__ == "__main__":
    main()
