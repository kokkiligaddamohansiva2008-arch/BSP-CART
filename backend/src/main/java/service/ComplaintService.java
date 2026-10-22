package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class ComplaintService {


    public String raiseComplaint() {
        return "Complaint Raised";
    }


    public String updateComplaintStatus(Long id,String status) {
        return "Complaint Status Updated";
    }


    public String resolveComplaint(Long id) {
        return "Complaint Resolved : " + id;
    }
}