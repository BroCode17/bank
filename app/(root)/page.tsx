import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions'
import RightSidebar from '@/components/RightSidebar'
import TotalBalanceBox from '@/components/TotalBalanceBox'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getBank, getBanks, getLoggedInUser } from '@/lib/actions/user.actions'
import { log } from '@/lib/utils'
import { SearchParamProps } from '@/types'
import React from 'react'

const HomePage = async ({searchParams: {id, page}}: SearchParamProps) => {
  const currentPage = Number(page as string ) || 1
  const loggedIn = await getLoggedInUser()
  //get banks and update the homepage
  const accounts = await getAccounts({userId: loggedIn.$id})

  if(!accounts) return;

  const accountData = accounts?.data

  const appwriteItemId = (id as string) || accountData[0]?.appwriteItemId

  const account = await getAccount({appwriteItemId})

  return (
    <section className='home'>
      <div className='home-content'>
        <header className="home-header">
            <HeaderBox
                type="greeting"
                title="welcome"
                user={loggedIn?.firstName || 'Guest'}
                subtext="Access and manage your account and transactions"
            />

            {/* Total Balance Box */}
            <TotalBalanceBox
                accounts={accountData}
                totalBanks = {accounts?.totalBanks}
                totalCurrentBalance={accounts?.totalCurrentBalance}
            />
        </header>
        <RecentTransactions 
        accounts={accountData}
        transactions = {account?.transactions}
        appwriteItemId = {appwriteItemId}
       page= {currentPage}
        />
      </div>
      {/* Will fix this latter */}
      <RightSidebar user={loggedIn} transactions={account?.transactions} banks={accountData?.slice(0,2)}/>
    </section>
  )
}

export default HomePage
