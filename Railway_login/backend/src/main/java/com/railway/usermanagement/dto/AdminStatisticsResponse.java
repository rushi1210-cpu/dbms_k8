package com.railway.usermanagement.dto;

public class AdminStatisticsResponse {

    private long totalUsers;
    private long totalPassengers;
    private long activeUsers;
    private long inactiveUsers;

    public AdminStatisticsResponse() {
    }

    public AdminStatisticsResponse(long totalUsers, long totalPassengers, long activeUsers, long inactiveUsers) {
        this.totalUsers = totalUsers;
        this.totalPassengers = totalPassengers;
        this.activeUsers = activeUsers;
        this.inactiveUsers = inactiveUsers;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalPassengers() {
        return totalPassengers;
    }

    public void setTotalPassengers(long totalPassengers) {
        this.totalPassengers = totalPassengers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getInactiveUsers() {
        return inactiveUsers;
    }

    public void setInactiveUsers(long inactiveUsers) {
        this.inactiveUsers = inactiveUsers;
    }
}
