import HeaderBox from '@/components/HeaderBox'
import RightSidebar from '@/components/RightSidebar'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const HomePage = async () => {
  const loggedIn = await getLoggedInUser()

  return (
    <section className='home'>
      <div className='home-content'>
        <header className="home-header">
            <HeaderBox
                type="greeting"
                title="welcome"
                user={loggedIn?.name || 'Guest'}
                subtext="Access and manage your account and transactions"
            />

            {/* Total Balance Box */}
            <TotalBalanceBox
                accounts={[]}
                totalBanks = {1}
                totalCurrentBalance={1250.45}
            />
        </header>
        Recent transactions
      </div>
      {/* Will fix this latter */}
      <RightSidebar user={loggedIn} transactions={[]} banks={[{currentBalance: 123.50},{currentBalance: 550.50}]}/>
    </section>
  )
}

export default HomePage
